const fs = require('fs');

typeof describe === 'undefined' || describe('service', function () {
  this.timeout(0)
  const chai = require('chai');
  const crypto = require('crypto');
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
      method: 'POST',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
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
      method: 'POST',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
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
      method: 'POST',
      resolveWithFullResponse: true,
      uri: 'http://localhost:8080',
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
 
const bodyParser = require('body-parser');
const cp = require('child_process');
const bounds = require('./bounds');
const img = require('./img');

const app = require('express')();
app.use(bodyParser.json());
app.post('/', (request, response) => {
  const {
    extent,
    size: { width, height },
  } = request.body;
  const { left, top, right, bottom } = extent;
  const upperLefts = bounds.toUpperLefts(extent);
  const imgPaths = img.pathsFromUpperLefts(upperLefts);
  cp.execSync(`gdalbuildvrt -overwrite /tmp/elevation.vrt ${imgPaths.join(' ')}`);
  cp.execSync(`python src/translate.py /tmp/elevation.vrt /tmp/translate.tif ${width} ${height} ${left} ${top} ${right} ${bottom}`, { stdio: 'inherit' });
  cp.execSync(`blender -b -P src/render.py -noaudio -o ///tmp/shaded-relief-#.tif -f 0 -- ${width} ${height} 2.0`, { stdio: 'inherit' });

  response.header('content-type', 'image/tiff');
  response.send(fs.readFileSync('/tmp/shaded-relief-0.tif'));
});
const server = app.listen(8080, () => console.log('0.0.0.0:8080'));