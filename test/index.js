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
  const { status } = await getMetadata(id);
  switch (status) {
    case 'processing':
      return true;
    case 'fulfilled':
      return false;
    default:
      throw Error('Render was not fulfilled\n' + JSON.stringify(metadata))
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

const compareSpatialReferenceSystems = (expected, file) => new Promise(
  (resolve, reject) => exec(
    `diff ${expected} <(gdalsrsinfo ${file})`,
    { shell: 'bash' },
    (error, stdout) => {
      if (error) reject(Error('SRS mismatch:\n' + stdout));
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
    await compareSpatialReferenceSystems('assets/4321.srs', tmpFile);
    // TODO assert size
    await writeFile(tmpFile, shadedRelief);
    await compareSpatialReferenceSystems('assets/4321.srs', tmpFile);
    // TODO assert size
  });
  it('should render with extent across multiple 3dep cells', async function () {
    await createRender({
      extent: { left: -107, right: -104.5, top: 38, bottom: 37 },
      id: 'two-plus-half',
      size: { width: 384, height: 128 },
    });

    while (await isRenderProcessing('two-plus-half')) { }

    const heightmap = await getHeightmap('two-plus-half');
    const shadedRelief = await getShadedRelief('two-plus-half');

    await writeFile(tmpFile, heightmap);
    await compareSpatialReferenceSystems('assets/two-plus-half.srs', tmpFile);
    // TODO assert size
    await writeFile(tmpFile, shadedRelief);
    await compareSpatialReferenceSystems('assets/two-plus-half.srs', tmpFile);
    // TODO assert size
  });
  afterEach(async function () {
    if (existsSync(tmpFile)) await unlink(tmpFile);
  });
  after(async function () {
    if (processUnderTest) murder(processUnderTest);
  });
});