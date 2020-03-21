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
    await Promise.all(
      [
        {
          id: '1234',
          json: {
            size: { width: 256, height: 256 },
            extent: { left: -106, right: -105, top: 38, bottom: 37 },
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
        uri: 'http://localhost:8080/1234',
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

    await Promise.all(
      [
        '/1234/heightmap.tif',
        '/two-plus-half/heightmap.tif',
        '/1234/shaded-relief.tif',
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
      responses
        .map(response => sha1(response.body)).should.deep.equal([
          sha1(fs.readFileSync('./assets/1234-heightmap.tif')),
          sha1(fs.readFileSync('./assets/two-plus-half-heightmap.tif')),
          sha1(fs.readFileSync('./assets/shaded-relief.tif')),
          sha1(fs.readFileSync('./assets/shaded-relief-two-plus-half.tif')),
        ]);
    });
  });
  after(function () {
    server.close();
  });
});

if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
const server = require('./app').listen(8080, () => console.log('0.0.0.0:8080'));