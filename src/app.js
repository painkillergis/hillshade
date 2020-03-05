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
      sandbox.stub(service, 'render');
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
    it('should return 400 for malformed/incomplete size', async function () {
      service.render.rejects();

      sizes = [
        {
          width: 'not great',
          height: 256,
        },
        {
          width: 256,
          height: 'not great',
        },
        {},
        [],
        19,
        null,
      ]

      await Promise.all(
        sizes.map(
          async size => {
            const response = await chai.request(app)
              .post('/')
              .set('content-type', 'application/json')
              .send({
                size,
                extent: {
                  left: -106,
                  right: -105,
                  top: 38,
                  bottom: 37,
                },
              });

            response.should.have.status(400);
            response.should.have.header('content-type', 'application/json; charset=utf-8');
            response.body.should.deep.equal({
              message: 'size was malformed or missing',
            });
          }
        )
      )
    });
    it('should return 400 for malformed/incomplete extent', async function () {
      service.render.rejects();

      extents = [
        {
          right: -105,
          top: 38,
          bottom: 37,
        },
        {
          left: -106,
          top: 38,
          bottom: 37,
        },
        {
          left: -106,
          right: -105,
          bottom: 37,
        },
        {
          left: -106,
          right: -105,
          top: 38,
        },
        {
          left: 'DEVIOUS',
          right: -105,
          top: 38,
          bottom: 37,
        },
        20,
        [],
        null,
      ]

      await Promise.all(
        extents.map(
          async extent => {
            const response = await chai.request(app)
              .post('/')
              .set('content-type', 'application/json')
              .send({
                size: {
                  width: 256,
                  height: 256,
                },
                extent,
              });

            response.should.have.status(400);
            response.should.have.header('content-type', 'application/json; charset=utf-8');
            response.body.should.deep.equal({
              message: 'extent was malformed or missing',
            });
          }
        )
      )
    });
    afterEach(function () {
      sandbox.restore();
    })
  })
});

const app = require('express')();
app.use(require('body-parser').json());
app.post('/', async (request, response) => {
  const { size, extent } = request.body;
  if (size === null
    || typeof size !== 'object'
    || typeof size.height !== 'number'
    || typeof size.width !== 'number'
  ) {
    response.status(400);
    response.json({
      message: 'size was malformed or missing',
    });
  } else if (extent === null
    || typeof extent !== 'object'
    || typeof extent.left !== 'number'
    || typeof extent.top !== 'number'
    || typeof extent.right !== 'number'
    || typeof extent.bottom !== 'number'
  ) {
    response.status(400);
    response.json({
      message: 'extent was malformed or missing',
    });
  } else {
    response.header('content-type', 'image/tiff');
    response.send(await service.render(request.body));
  }
});

module.exports = app;