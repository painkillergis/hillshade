const promisify = require('util').promisify;
const fs = require('fs');

const chai = require('chai');
const exec = promisify(require('child_process').exec);
const existsSync = fs.existsSync;
const request = require('request-promise');
const unlink = promisify(fs.unlink);
const uuid4 = require('uuid').v4;
const writeFile = promisify(fs.writeFile);
const { murder, spawnApp } = require('spawn-app')

chai.should();
chai.use(require('chai-as-promised'));

describe('service', function () {
  this.timeout(0)
  let processUnderTest;
  let tmpFile;
  before(async function () {
    processUnderTest = await spawnApp({
      timeoutMs: 4000,
      path: './src/index.js',
    });
    tmpFile = `/tmp/${uuid4()}`;
  });
  it('should 404 when getting non-existent image', async function () {
    const response = await request({
      method: 'GET',
      resolveWithFullResponse: true,
      simple: false,
      uri: 'http://localhost:8080/non-existent/shaded-relief.tif',
    });

    response.statusCode.should.equal(404);
  });
  it('should put and get shaded relief images', async function () {
    await Promise.all(
      [
        {
          id: '4321',
          json: {
            cutline: require('../assets/cutline.json'),
            samples: 96,
            scale: 1.5,
            size: { width: 128, height: 128 },
            srid: 'EPSG:26915',
            margin: {
              vertical: 16,
              horizontal: 8,
            },
          },
        },
        {
          id: 'two-plus-half',
          json: {
            size: { width: 384, height: 128 },
            extent: { left: -107, right: -104.5, top: 38, bottom: 37 },
          },
        },
      ].map(
        ({ id, json }) => request({
          json,
          method: 'PUT',
          resolveWithFullResponse: true,
          uri: `http://localhost:8080/${id}`,
        })
      )
    ).then(responses => responses.forEach(
      ({ statusCode }) => statusCode.should.equal(204)
    ));

    let body = {};
    while (!body.status || body.status == 'processing') {
      const response = await request({
        json: true,
        resolveWithFullResponse: true,
        simple: false,
        uri: 'http://localhost:8080/4321',
      });
      response.statusCode.should.equal(200);
      body = response.body;
    }
    if (body.status !== 'fulfilled') {
      throw Error('Render was not fulfilled\n' + JSON.stringify(body))
    }

    body = {};
    while (!body.status || body.status == 'processing') {
      const response = await request({
        json: true,
        resolveWithFullResponse: true,
        simple: false,
        uri: 'http://localhost:8080/two-plus-half',
      });
      response.statusCode.should.equal(200);
      body = response.body;
    }
    if (body.status !== 'fulfilled') {
      throw Error('Render was not fulfilled\n' + JSON.stringify(body))
    }

    const rasters = await Promise.all(
      [
        '/4321/heightmap.tif',
        '/two-plus-half/heightmap.tif',
        '/4321/shaded-relief.tif',
        '/two-plus-half/shaded-relief.tif',
      ].map(
        path => request({
          encoding: null,
          method: 'GET',
          resolveWithFullResponse: true,
          uri: `http://localhost:8080${path}`,
        })
      ),
    ).then(responses => {
      responses.forEach(response => response.headers['content-type'].should.contain('image/tiff'));
      return responses.map(response => response.body);
    });
    await writeFile(tmpFile, rasters[0]);
    (await exec(`gdalcompare.py assets/4321-heightmap.tif ${tmpFile} || exit 0`))
      .stdout.should.equal('Differences Found: 0\n');
    await writeFile(tmpFile, rasters[1]);
    (await exec(`gdalcompare.py assets/two-plus-half-heightmap.tif ${tmpFile} || exit 0`))
      .stdout.should.equal('Differences Found: 0\n');
    await writeFile(tmpFile, rasters[2]);
    (await exec(`gdalcompare.py assets/4321-shaded-relief.tif ${tmpFile} || exit 0`))
      .stdout.should.equal('Differences Found: 0\n');
    await writeFile(tmpFile, rasters[3]);
    (await exec(`gdalcompare.py assets/two-plus-half-shaded-relief.tif ${tmpFile} || exit 0`))
      .stdout.should.equal('Differences Found: 0\n');
  });
  after(async function () {
    if (existsSync(tmpFile)) await unlink(tmpFile);
    if (processUnderTest) murder(processUnderTest);
  });
});