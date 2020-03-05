const service = require('./service');

typeof describe === 'undefined' || describe('app', function () {
  describe('POST /', function () {
    const chai = require('chai');
    chai.should();
    chai.use(require('chai-as-promised'));
    chai.use(require('chai-http'));
    chai.use(require('sinon-chai'));
    const sinon = require('sinon');
    let sandbox;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
    })
    it('should render', async function () {
      const body = {
        size: {
          width: 256,
          height: 256,
        },
        extent: {
          left: -106,
          right: -105,
          top: 38,
          bottom: 37,
        },
      };

      sandbox.stub(service, 'render');
      service.render.withArgs(body).resolves(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

      const response = await chai.request(app)
        .post('/')
        .set('content-type', 'application/json')
        .send(body)
        .buffer();

      response.should.have.status(200);
      response.should.have.header('content-type', 'image/tiff');
      response.body.should.deep.equal(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));
    });
    afterEach(function () {
      sandbox.restore();
    })
  })
});

const app = require('express')();
app.use(require('body-parser').json());
app.post('/', async (request, response) => {
  response.header('content-type', 'image/tiff');
  response.send(await service.render(request.body));
});

module.exports = app;