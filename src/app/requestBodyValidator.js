const service = require('./service');
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
    sandbox.stub(requestBodyValidations, 'isSizeMalformed');
  });
  it('should message for malformed cutline', async function () {
    const cutline = { could: 'be any cutline' };
    const size = { could: 'be any size' };
    requestBodyValidations.isCutlineMalformed.withArgs(cutline).resolves(true);

    validate({ cutline, size }).should.eventually.equal('cutline is malformed');
  });
  it('should return 400 for missing cutline or extent', async function () {
    const size = { could: 'be any size' };

    validate({ size }).should.eventually.equal('cutline or extent is missing');
  });
  it('should return 400 for malformed extent', async function () {
    const extent = { could: 'be any extent' };
    const size = { could: 'be any size' };
    requestBodyValidations.isExtentMalformed.withArgs(extent).resolves(true);

    validate({ extent, size }).should.eventually.equal('extent is malformed');
  });
  it('should return 400 for malformed margin', async function () {
    const cutline = { could: 'be any cutline' };
    const size = { could: 'be any size' };
    const margin = 'bad bad margin';
    requestBodyValidations.isMarginMalformed.withArgs(margin).resolves(true);

    validate({ cutline, margin, size }).should.eventually.equal('margin is malformed');
  })
  it('should return 400 for missing size', async function () {
    const extent = { could: 'be any extent' };

    validate({ extent }).should.eventually.equal('size is missing');
  });
  it('should return 400 for malformed size', async function () {
    const extent = { could: 'be any extent' };
    const size = { could: 'be any size' };
    requestBodyValidations.isSizeMalformed.withArgs(size).resolves(true);

    validate({ extent, size }).should.eventually.equal('size is malformed');
  });
  afterEach(function () {
    sandbox.restore();
  });
});

const validate = async ({ cutline, extent, margin, size }) => {
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
  }
};

module.exports = ({ validate });