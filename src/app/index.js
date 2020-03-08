const service = require('./service');

typeof describe === 'undefined' || describe('app', function () {
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
  describe('GET /:id/heightmap.tif', function () {
    it('should return heightmap tif by id', async function () {
      sandbox.stub(service, 'getHeightmapById');
      service.getHeightmapById.withArgs('the_id').resolves(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

      const response = await chai.request(app)
        .get('/the_id/heightmap.tif')
        .buffer();

      response.should.have.status(200);
      response.should.have.header('content-type', 'image/tiff');
      response.body.should.deep.equal(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));
    });
  });
  describe('GET /:id/shaded-relief.tif', function () {
    it('should return shaded relief tif by id', async function () {
      sandbox.stub(service, 'getShadedReliefById');
      service.getShadedReliefById.withArgs('the_id').resolves(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

      const response = await chai.request(app)
        .get('/the_id/shaded-relief.tif')
        .buffer();

      response.should.have.status(200);
      response.should.have.header('content-type', 'image/tiff');
      response.body.should.deep.equal(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));
    });
    it('should return 404 when shaded relief by id not found', async function () {
      sandbox.stub(service, 'getShadedReliefById');
      service.getShadedReliefById.withArgs('the_id').resolves(null);

      const response = await chai.request(app)
        .get('/the_id/shaded-relief.tif');

      response.should.have.status(404);
    });
  });
  describe('PUT /:id', function () {
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

      service.render.withArgs({ ...body, id: 'the_id' }).resolves(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

      const response = await chai.request(app)
        .put('/the_id')
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
              .put('/the_id')
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
              .put('/the_id')
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
    it('should return 500 when service yacks', async function () {
      service.render.rejects(new Error('hey world'));

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({
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
        });

      response.should.have.status(500);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({
        error: 'hey world',
      });
    });
  });
  afterEach(function () {
    sandbox.restore();
  });
});

const app = require('express')();
app.use(require('body-parser').json());

app.get('/:id/heightmap.tif', async (request, response) => {
  response
    .set('content-type', 'image/tiff')
    .send(await service.getHeightmapById(request.params.id));
});

app.get('/:id/shaded-relief.tif', async (request, response) => {
  const image = await service.getShadedReliefById(request.params.id);
  if (image) {
    response
      .set('content-type', 'image/tiff')
      .send(image);
  } else {
    response.sendStatus(404);
  }
});

app.put('/:id', async (request, response) => {
  const { size, extent } = request.body;
  if (isSizeInvalid(size)) {
    response.status(400)
      .json({ message: 'size was malformed or missing' });
  } else if (isExtentInvalid(extent)) {
    response.status(400)
      .json({ message: 'extent was malformed or missing' });
  } else {
    try {
      response
        .set('content-type', 'image/tiff')
        .send(await service.render({ ...request.body, id: request.params.id }));
    } catch (error) {
      response
        .status(500)
        .set('content-type', 'application/json')
        .json({ error: error.message })
    }
  }
});

const isSizeInvalid = size => size === null
  || typeof size !== 'object'
  || typeof size.height !== 'number'
  || typeof size.width !== 'number'

const isExtentInvalid = extent => extent === null
  || typeof extent !== 'object'
  || typeof extent.left !== 'number'
  || typeof extent.top !== 'number'
  || typeof extent.right !== 'number'
  || typeof extent.bottom !== 'number'

module.exports = app;