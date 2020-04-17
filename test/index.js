const promisify = require('util').promisify;
const fs = require('fs');

const assert = require('assert');
const chai = require('chai');
const exec = require('child_process').exec;
const existsSync = fs.existsSync;
const request = require('request-promise');
const StatusCodeError = require('request-promise/errors').StatusCodeError;
const unlink = promisify(fs.unlink);
const uuid4 = require('uuid').v4;
const writeFile = promisify(fs.writeFile);
const { murder, spawnApp } = require('spawn-app');

chai.should();
chai.use(require('chai-as-promised'));

const createRender = ({ id, ...json }) => request({
  json,
  method: 'PUT',
  resolveWithFullResponse: true,
  uri: `http://localhost:8080/${id}`,
});

const getMetadata = id => request({
  json: true,
  resolveWithFullResponse: true,
  uri: `http://localhost:8080/${id}`,
}).then(response => response.body);

const isRenderProcessing = async id => {
  const { status, error } = await getMetadata(id);
  switch (status) {
    case 'processing':
      return true;
    case 'fulfilled':
      return false;
    default:
      throw Error('Render was not fulfilled\nServer error: ' + error);
  }
};

const getTiff = (id, filename) => request({
  encoding: null,
  method: 'GET',
  resolveWithFullResponse: true,
  uri: `http://localhost:8080/${id}/${filename}.tif`,
}).then(response => {
  assert.deepEqual(response.headers['content-type'], 'image/tiff');
  return response.body;
});

const getHeightmap = id => getTiff(id, 'heightmap');
const getShadedRelief = id => getTiff(id, 'shaded-relief');

const assertGdalInfo = (expected, file) => new Promise(
  (resolve, reject) => exec(
    `diff <(grep -v 'Files:' ${expected}) <(gdalinfo ${file} | grep -v 'Files:')`,
    { shell: 'bash' },
    (error, stdout) => {
      if (error) reject(Error('gdalinfo mismatch:\n' + stdout));
      else resolve();
    }
  )
);

describe('service', function () {
  this.timeout(0)
  let processUnderTest;
  before(async function () {
    processUnderTest = await spawnApp({
      timeoutMs: 4000,
      path: './src/index.js',
    });
    processUnderTest.stdout.on('data', data => console.log('ProcessUnderTest>', data))
    processUnderTest.stderr.on('data', data => console.error('ProcessUnderTest>', data))
  });
  let tmpFile;
  beforeEach(async function () {
    tmpFile = `/tmp/${uuid4()}`;
  });
  it('should 404 when getting non-existent image', async function () {
    await getShadedRelief('non-existent')
      .should.eventually.be.rejectedWith(StatusCodeError)
      .and.have.property('statusCode', 404);
  });
  it('should render with cutline and optional parameters', async function () {
    await createRender({
      cutline: require('../assets/cutline.json'),
      id: '4321',
      margin: {
        vertical: 16,
        horizontal: 8,
      },
      samples: 96,
      scale: 1.5,
      size: { width: 128, height: 128 },
      srid: 'EPSG:26915',
    });

    while (await isRenderProcessing('4321')) { }

    const heightmap = await getHeightmap('4321');
    const shadedRelief = await getShadedRelief('4321');

    await writeFile(tmpFile, heightmap);
    await assertGdalInfo('assets/4321-heightmap.gdalinfo', tmpFile);
    await writeFile(tmpFile, shadedRelief);
    await assertGdalInfo('assets/4321-shaded-relief.gdalinfo', tmpFile);
  });
  it('should render with extent across multiple 3dep cells', async function () {
    await createRender({
      extent: { left: -107.125, right: -106.875, top: 38.125, bottom: 37.875 },
      id: 'kitty-corner',
      size: { width: 64, height: 64 },
    });

    while (await isRenderProcessing('kitty-corner')) { }

    const heightmap = await getHeightmap('kitty-corner');
    const shadedRelief = await getShadedRelief('kitty-corner');

    await writeFile(tmpFile, heightmap);
    await assertGdalInfo('assets/kitty-corner-heightmap.gdalinfo', tmpFile);
    await writeFile(tmpFile, shadedRelief);
    await assertGdalInfo('assets/kitty-corner-shaded-relief.gdalinfo', tmpFile);
  });
  it('should return timings', async function () {
    await createRender({
      extent: { left: -107.125, right: -107, top: 37.125, bottom: 37 },
      id: 'mini-corner',
      size: { width: 64, height: 64 },
    });

    while (await isRenderProcessing('mini-corner')) { }

    const { timings } = getMetadata('mini-corner');
    timings.start < new Date();
    timings.virtualDatasetDuration.should.be.a.number();
    timings.heightmapDuration.should.be.a.number();
    timings.blenderDuration.should.be.a.number();
    timings.geoTransformDuration.should.be.a.number();
  });
  afterEach(async function () {
    if (existsSync(tmpFile)) await unlink(tmpFile);
  });
  after(async function () {
    if (processUnderTest) murder(processUnderTest);
  });
});