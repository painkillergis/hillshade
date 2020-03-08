typeof describe === 'undefined' || describe('service', function () {
  this.timeout(0)
  const chai = require('chai');
  const crypto = require('crypto');
  const fs = require('fs');
  const request = require('request-promise');
  chai.should();
  chai.use(require('chai-as-promised'));
  const sha1 = buffer => crypto.createHash('sha1')
    .update(buffer)
    .digest('hex');
  it('should 404 when getting non-existent image', async function () {
    const response = await request({
      method: 'GET',
      resolveWithFullResponse: true,
      simple: false,
      uri: 'http://localhost:8080/non-existent/shaded-relief.tif',
    });

    response.statusCode.should.equal(404);
  })
  it('should put and get shaded relief images', async function () {
    const putResponses = await Promise.all([
      request({
        json: {
          size: {
            width: 256,
            height: 256,
          },
          extent: {
            left: -106.,
            right: -105,
            top: 38,
            bottom: 37,
          },
        },
        method: 'PUT',
        resolveWithFullResponse: true,
        uri: 'http://localhost:8080/1234',
      }),
      request({
        encoding: null,
        json: {
          size: {
            width: 384,
            height: 128,
          },
          extent: {
            left: -107,
            right: -104.5,
            top: 38,
            bottom: 37,
          },
        },
        method: 'PUT',
        resolveWithFullResponse: true,
        uri: 'http://localhost:8080/two-plus-half',
      })
    ]);

    putResponses[0].statusCode.should.be.lessThan(300);
    putResponses[1].statusCode.should.be.lessThan(300);

    const getHeightmapResponse = await request({
      encoding: null,
      method: 'GET',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/1234/heightmap.tif',
    });
    const getHeightmapResponse2 = await request({
      encoding: null,
      method: 'GET',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/two-plus-half/heightmap.tif',
    });
    getHeightmapResponse.headers['content-type'].should.contain('image/tiff');
    getHeightmapResponse2.headers['content-type'].should.contain('image/tiff');
    sha1(getHeightmapResponse.body).should.equal(sha1(fs.readFileSync('./assets/1234-heightmap.tif')));
    sha1(getHeightmapResponse2.body).should.equal(sha1(fs.readFileSync('./assets/two-plus-half-heightmap.tif')));

    const getShadedReliefResponse = await request({
      encoding: null,
      method: 'GET',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/1234/shaded-relief.tif',
    });
    const getShadedReliefResponse2 = await request({
      encoding: null,
      method: 'GET',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/two-plus-half/shaded-relief.tif',
    });
    getShadedReliefResponse.headers['content-type'].should.contain('image/tiff');
    getShadedReliefResponse2.headers['content-type'].should.contain('image/tiff');
    sha1(getShadedReliefResponse.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief.tif')));
    sha1(getShadedReliefResponse2.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief-two-plus-half.tif')));
  });
  after(function () {
    server.close();
  });
});

if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
const server = require('./app').listen(8080, () => console.log('0.0.0.0:8080'));