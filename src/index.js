const fs = require('fs');

typeof describe === 'undefined' || describe('service', function () {
  this.timeout(0)
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
    sha1(responseBig.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief.tif')));

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
    sha1(responseSmall.body).should.equal(sha1(fs.readFileSync('./assets/shaded-relief-small.tif')));
  });
  after(function () {
    server.close();
  });
});

const cp = require('child_process');

const app = require('express')();
app.get('/', (ignored, response) => {
  cp.execSync('python src/translate.py assets/USGS_NED_13_n38w106_IMG.img /tmp/translate.tif', { stdio: 'inherit' });
  cp.execSync('blender -b -P src/render.py -noaudio -o ///tmp/shaded-relief-#.tif -f 0 -- 0', { stdio: 'inherit' });

  response.header('content-type', 'image/tiff');
  response.send(fs.readFileSync('/tmp/shaded-relief-0.tif'));
});
const server = app.listen(8080, () => console.log('0.0.0.0:8080'));