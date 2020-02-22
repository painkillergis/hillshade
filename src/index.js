const fs = require('fs');

typeof describe === 'undefined' || describe('service', function () {
  const chai = require('chai');
  const crypto = require('crypto');
  const request = require('request-promise');
  chai.should();
  chai.use(require('chai-as-promised'));
  it('should return shaded relief TIFF with predetermined extent', async function () {
    const sha1 = buffer => crypto.createHash('sha1')
      .update(buffer)
      .digest('hex');

    const responseBig = await request({
      json: {
        width: 256,
        height: 256,
      },
      encoding: null,
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
    });
    responseBig.headers['content-type'].should.contain('image/tiff');
    sha1(responseBig.body).should.equal(sha1(fs.readFileSync('./src/shaded-relief.tif')));

    const responseSmall = await request({
      json: {
        width: 128,
        height: 128,
      },
      encoding: null,
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
    });
    responseSmall.headers['content-type'].should.contain('image/tiff');
    sha1(responseSmall.body).should.equal(sha1(fs.readFileSync('./src/shaded-relief-small.tif')));
  });
  after(function () {
    server.close();
  });
});


const app = require('express')();
app.get('/', (ignored, response) => {
  response.header('content-type', 'image/tiff');
  response.send(fs.readFileSync('./src/shaded-relief.tif'));
});
const server = app.listen(8080, () => console.log('0.0.0.0:8080'));