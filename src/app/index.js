const service = require('./service');
const requestBodyValidations = require('./requestBodyValidations');

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
    sandbox.stub(service, 'createShadedRelief');
    sandbox.stub(requestBodyValidations, 'isMarginMalformed');
    sandbox.stub(requestBodyValidations, 'isCutlineMalformed');
    sandbox.stub(requestBodyValidations, 'isExtentMalformed');
    sandbox.stub(requestBodyValidations, 'isSizeMalformed');
  });
  describe('GET /:id', function () {
    beforeEach(function () {
      sandbox.stub(service, 'getMetadataById');
    });
    it('should return metadata by id', async function () {
      service.getMetadataById.withArgs('the_id').resolves({ could: 'be anything' });

      const response = await chai.request(app)
        .get('/the_id');

      response.should.have.status(200);
      response.body.should.deep.equal({ could: 'be anything' });
    });
    it('should return 404 when metadata by id is not available', async function () {
      service.getMetadataById.withArgs('the_id').resolves(null);

      const response = await chai.request(app)
        .get('/the_id');

      response.should.have.status(404);
    });
    it('should return 500 when metadata by id has error', async function () {
      service.getMetadataById.withArgs('the_id').rejects(new Error('the message'));

      const response = await chai.request(app)
        .get('/the_id');

      response.should.have.status(500);
      response.body.should.deep.equal({ error: 'the message' });
    });
  });
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
    it('should render with extent and size', async function () {
      const extent = { could: 'be any extent' };
      const size = { could: 'be any size' };
      requestBodyValidations.isExtentMalformed.withArgs(extent).resolves(false);
      requestBodyValidations.isSizeMalformed.withArgs(size).resolves(false);
      requestBodyValidations.isMarginMalformed.resolves(true);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ extent, size });

      response.should.have.status(204);
      service.createShadedRelief.should.have.been.calledWith({ extent, size, id: 'the_id' });
    });
    it('should render with cutline and size', async function () {
      const cutline = { could: 'be any cutline' };
      const size = { could: 'be any size' };
      requestBodyValidations.isCutlineMalformed.withArgs(cutline).resolves(false);
      requestBodyValidations.isSizeMalformed.withArgs(size).resolves(false);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ cutline, size });

      response.should.have.status(204);
      service.createShadedRelief.should.have.been.calledWith({ cutline, size, id: 'the_id' });
    });
    it('should render with margin', async function () {
      const cutline = { could: 'be any cutline' };
      const size = { could: 'be any size' };
      const margin = 32;

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ cutline, margin, size });

      response.should.have.status(204);
      service.createShadedRelief.should.have.been.calledWith({ cutline, margin, size, id: 'the_id' });
    });
    it('should return 400 for malformed cutline', async function () {
      const cutline = { could: 'be any cutline' };
      const size = { could: 'be any size' };
      requestBodyValidations.isCutlineMalformed.withArgs(cutline).resolves(true);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ cutline, size });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'cutline is malformed' });
      service.createShadedRelief.should.not.have.been.called;
    });
    it('should return 400 for missing cutline or extent', async function () {
      const size = { could: 'be any size' };

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ size });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'cutline or extent is missing' });
      service.createShadedRelief.should.not.have.been.called;
    });
    it('should return 400 for malformed extent', async function () {
      const extent = { could: 'be any extent' };
      const size = { could: 'be any size' };
      requestBodyValidations.isExtentMalformed.withArgs(extent).resolves(true);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ extent, size });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'extent is malformed' });
      service.createShadedRelief.should.not.have.been.called;
    });
    it('should return 400 for malformed margin', async function () {
      const cutline = { could: 'be any cutline' };
      const size = { could: 'be any size' };
      const margin = 'bad bad margin';
      requestBodyValidations.isMarginMalformed.withArgs(margin).resolves(true);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ cutline, margin, size });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'margin is malformed' });
      service.createShadedRelief.should.not.have.been.called;
    })
    it('should return 400 for missing size', async function () {
      const extent = { could: 'be any extent' };

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ extent });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'size is missing' });
      service.createShadedRelief.should.not.have.been.called;
    });
    it('should return 400 for malformed size', async function () {
      const extent = { could: 'be any extent' };
      const size = { could: 'be any size' };
      requestBodyValidations.isSizeMalformed.withArgs(size).resolves(true);

      const response = await chai.request(app)
        .put('/the_id')
        .set('content-type', 'application/json')
        .send({ extent, size });

      response.should.have.status(400);
      response.should.have.header('content-type', 'application/json; charset=utf-8');
      response.body.should.deep.equal({ message: 'size is malformed' });
      service.createShadedRelief.should.not.have.been.called;
    });
  });
  afterEach(function () {
    sandbox.restore();
  });
});

const app = require('express')();
app.use(require('body-parser').json({ limit: '1mb' }));

app.get('/:id', async (request, response) => {
  try {
    const metadata = await service.getMetadataById(request.params.id);
    metadata
      ? response.json(metadata)
      : response.sendStatus(404);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

app.get('/:id/heightmap.tif', async (request, response) => {
  response
    .set('content-type', 'image/tiff')
    .send(await service.getHeightmapById(request.params.id));
});

app.get('/:id/shaded-relief.tif', async (request, response) => {
  const image = await service.getShadedReliefById(request.params.id);
  image
    ? response
      .set('content-type', 'image/tiff')
      .send(image)
    : response.sendStatus(404);
});

app.put('/:id', async (request, response) => {
  const { cutline, extent, margin, size } = request.body;
  if (cutline == null && extent == null) {
    response.status(400)
      .json({ message: 'cutline or extent is missing' });
  } else if (cutline && await requestBodyValidations.isCutlineMalformed(cutline)) {
    response.status(400)
      .json({ message: 'cutline is malformed' });
  } else if (extent && await requestBodyValidations.isExtentMalformed(extent)) {
    response.status(400)
      .json({ message: 'extent is malformed' });
  } else if (size == null) {
    response.status(400)
      .json({ message: 'size is missing' });
  } else if (await requestBodyValidations.isSizeMalformed(size)) {
    response.status(400)
      .json({ message: 'size is malformed' });
  } else if (margin != null && await requestBodyValidations.isMarginMalformed(margin)) {
    response.status(400)
      .json({ message: 'margin is malformed' });
  } else {
    service.createShadedRelief({ ...request.body, id: request.params.id });
    response.sendStatus(204);
  }
});

module.exports = app;