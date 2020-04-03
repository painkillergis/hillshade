const requestBodyValidations = require('./requestBodyValidations');

typeof describe === 'undefined' || describe('requestBodyValidator', function () {
  const chai = require('chai');
  chai.should();
  chai.use(require('chai-as-promised'));
  chai.use(require('sinon-chai'));
  const sinon = require('sinon');
  let sandbox;
  beforeEach(function () {
    sandbox = sinon.createSandbox();
    sandbox.stub(requestBodyValidations, 'isMarginMalformed');
    sandbox.stub(requestBodyValidations, 'isCutlineMalformed');
    sandbox.stub(requestBodyValidations, 'isExtentMalformed');
    sandbox.stub(requestBodyValidations, 'isSamplesMalformed');
    sandbox.stub(requestBodyValidations, 'isSizeMalformed');
  });
  it('should not return message', async function () {
    const cutline = size = {};
    requestBodyValidations.isMarginMalformed.resolves(true);
    requestBodyValidations.isExtentMalformed.resolves(true);
    requestBodyValidations.isSamplesMalformed.resolves(true);
    requestBodyValidations.isExtentMalformed.resolves(true);

    await validate({ cutline, size }).should.eventually.equal(undefined);
  });
  it('should return malformed cutline message', async function () {
    const cutline = { could: 'be any cutline' };
    const size = { could: 'be any size' };
    requestBodyValidations.isCutlineMalformed.withArgs(cutline).resolves(true);

    await validate({ cutline, size }).should.eventually.equal('cutline is malformed');
  });
  it('should return missing cutline or extent message', async function () {
    const size = { could: 'be any size' };

    await validate({ size }).should.eventually.equal('cutline or extent is missing');
  });
  it('should return malformed extent message', async function () {
    const extent = { could: 'be any extent' };
    const size = { could: 'be any size' };
    requestBodyValidations.isExtentMalformed.withArgs(extent).resolves(true);

    await validate({ extent, size }).should.eventually.equal('extent is malformed');
  });
  it('should return malformed margin message', async function () {
    const cutline = { could: 'be any cutline' };
    const size = { could: 'be any size' };
    const margin = 'bad bad margin';
    requestBodyValidations.isMarginMalformed.withArgs(margin).resolves(true);

    await validate({ cutline, margin, size }).should.eventually.equal('margin is malformed');
  })
  it('should return missing size message', async function () {
    const extent = { could: 'be any extent' };

    await validate({ extent }).should.eventually.equal('size is missing');
  });
  it('should return malformed size message', async function () {
    const extent = { could: 'be any extent' };
    const size = { could: 'be any size' };
    requestBodyValidations.isSizeMalformed.withArgs(size).resolves(true);

    validate({ extent, size }).should.eventually.equal('size is malformed');
  });
  it('should return malformed samples message', async function () {
    const extent = { could: 'be any extent' };
    const size = { could: 'be any size' };
    const samples = 69;
    requestBodyValidations.isSamplesMalformed.withArgs(samples).resolves(true);

    await validate({ extent, samples, size }).should.eventually.equal('samples is malformed');
  });
  afterEach(function () {
    sandbox.restore();
  });
});

const validate = async ({ cutline, extent, margin, samples, size }) => {
  if (cutline == null && extent == null) {
    return 'cutline or extent is missing';
  } else if (cutline && await requestBodyValidations.isCutlineMalformed(cutline)) {
    return 'cutline is malformed';
  } else if (extent && await requestBodyValidations.isExtentMalformed(extent)) {
    return 'extent is malformed';
  } else if (size == null) {
    return 'size is missing';
  } else if (await requestBodyValidations.isSizeMalformed(size)) {
    return 'size is malformed';
  } else if (margin != null && await requestBodyValidations.isMarginMalformed(margin)) {
    return 'margin is malformed';
  } else if (samples != null && await requestBodyValidations.isSamplesMalformed(samples)) {
    return 'samples is malformed';
  }
};

module.exports = ({ validate });