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
  it('should return shaded relief TIFF with extent matching 3dep tile', async function () {
    const response = await request({
      encoding: null,
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
    });
    response.headers['content-type'].should.contain('image/tiff');
    sha1(response.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief.tif')));
  });
  it('should return shaded relief TIFF with extent matching half 3dep tile', async function () {
    const response = await request({
      encoding: null,
      json: {
        size: {
          width: 128,
          height: 256,
        },
        extent: {
          left: -106,
          right: -105.5,
          top: 38,
          bottom: 37,
        },
      },
      method: 'PUT',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/left',
    });
    response.headers['content-type'].should.contain('image/tiff');
    sha1(response.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief-left.tif')));
  });
  it('should return shaded relief TIFF with extent spanning two 3dep tiles', async function () {
    const response = await request({
      encoding: null,
      json: {
        size: {
          width: 256,
          height: 128,
        },
        extent: {
          left: -107,
          right: -105,
          top: 38,
          bottom: 37,
        },
      },
      method: 'PUT',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080/two',
    });
    response.headers['content-type'].should.contain('image/tiff');
    sha1(response.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief-two.tif')));
  });
  after(function () {
    server.close();
  });
});

if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
const server = require('./app').listen(8080, () => console.log('0.0.0.0:8080'));