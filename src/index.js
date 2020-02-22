const fs = require('fs');

typeof describe === 'undefined' || describe('service', function () {
  const chai = require('chai');
  const crypto = require('crypto');
  const request = require('request-promise');
  chai.should();
  chai.use(require('chai-as-promised'));
  it('should return shaded relief TIFF with predetermined size and extent', async function () {
    const sha1 = buffer => crypto.createHash('sha1')
      .update(buffer)
      .digest('hex');
    const response = await request({
      encoding: null,
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
    });
    response.headers['content-type'].should.contain('image/tiff');
    sha1(response.body).should.equal(sha1(fs.readFileSync('./src/shaded-relief.tif')));
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