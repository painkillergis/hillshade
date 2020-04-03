const geojsonValidation = require('geojson-validation');

typeof describe === 'undefined' || describe('validation', function () {
  const chai = require('chai');
  chai.should();
  chai.use(require('chai-as-promised'));
  chai.use(require('sinon-chai'))
  const sinon = require('sinon');
  describe('isCutlineMalformed', function () {
    let sandbox;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
      sandbox.stub(geojsonValidation, 'isFeatureCollection');
    });
    it('should be malformed when geojson-validation says so', async function () {
      const cutline = { could: 'be anything' };
      geojsonValidation.isFeatureCollection.withArgs(cutline).returns(true);

      await isCutlineMalformed(cutline).should.eventually.equal(false);
    });
    it('should not be malformed when geojson-validation says so', async function () {
      const cutline = { could: 'be anything' };
      geojsonValidation.isFeatureCollection.withArgs(cutline).returns(false);

      await isCutlineMalformed(cutline).should.eventually.equal(true);
    });
    afterEach(function () {
      sandbox.restore();
    });
  });
  describe('isExtentMalformed', function () {
    it('should not be malformed for good extent', async function () {
      await isExtentMalformed({ left: 20, top: 45.2, right: -20.5, bottom: 0 }).should.eventually.equal(false);
    });
    it('should be malformed for incorrect data type', async function () {
      await isExtentMalformed([]).should.eventually.equal(true);
      await isExtentMalformed(false).should.eventually.equal(true);
      await isExtentMalformed(1).should.eventually.equal(true);
    });
    it('should be malformed for missing left, top, right, or bottom', async function () {
      await isExtentMalformed({ top: 45.2, right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, right: -20.5 }).should.eventually.equal(true);
    });
    it('should be malformed for left, top, right, or bottom with incorrect data type', async function () {
      await isExtentMalformed({ left: [], top: 45.2, right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: '45.2', right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, right: false, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, right: -20.5, bottom: {} }).should.eventually.equal(true);
    });
    it('should be malformed for too wide or tall bounds', async function () {
      await isExtentMalformed({ left: -180.1, top: 45.2, right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 90.1, right: -20.5, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, right: 180.1, bottom: 0 }).should.eventually.equal(true);
      await isExtentMalformed({ left: 20, top: 45.2, right: -20.5, bottom: -90.1 }).should.eventually.equal(true);
    });
  });
  describe('isMarginMalformed', function () {
    it('should not be malformed', async function () {
      await isMarginMalformed({ vertical: 1, horizontal: 1 }).should.eventually.equal(false);
      await isMarginMalformed({ horizontal: 1 }).should.eventually.equal(false);
      await isMarginMalformed({ vertical: 1 }).should.eventually.equal(false);
    })
    it('should be malformed for incorrect data type', async function () {
      await isMarginMalformed([]).should.eventually.equal(true);
      await isMarginMalformed(false).should.eventually.equal(true);
      await isMarginMalformed(1).should.eventually.equal(true);
    });
    it('should be malformed for horizontal or vertical with incorrect data type', async function () {
      await isMarginMalformed({ horizontal: [] }).should.eventually.equal(true);
      await isMarginMalformed({ horizontal: false }).should.eventually.equal(true);
      await isMarginMalformed({ vertical: 1, horizontal: -1 }).should.eventually.equal(true);
      await isMarginMalformed({ vertical: [] }).should.eventually.equal(true);
      await isMarginMalformed({ vertical: false }).should.eventually.equal(true);
      await isMarginMalformed({ vertical: -1, horizontal: 1 }).should.eventually.equal(true);
    });
  });
  describe('isSamplesMalformed', function () {
    it('should not be malformed', async function () {
      await isSamplesMalformed(20000).should.eventually.equal(false);
    });
    it('should be malformed for incorrect data type', async function () {
      await isSamplesMalformed(-20000).should.eventually.equal(true);
      await isSamplesMalformed(2000.5).should.eventually.equal(true);
    })
  });
  describe('isSizeMalformed', function () {
    it('should be malformed for incorrect data type', async function () {
      await isSizeMalformed([]).should.eventually.equal(true);
      await isSizeMalformed(false).should.eventually.equal(true);
      await isSizeMalformed(1).should.eventually.equal(true);
    });
    it('should be malformed for missing height or width', async function () {
      await isSizeMalformed({ width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200 }).should.eventually.equal(true);
    });
    it('should be malformed for width or height with incorrect data type', async function () {
      await isSizeMalformed({ height: [], width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 1.2, width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: false, width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: {}, width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 'string', width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: [] }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: 1.2 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: false }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: {} }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: 'string' }).should.eventually.equal(true);
    });
    it('should be malformed for negative width or height', async function () {
      await isSizeMalformed({ height: -200, width: 200 }).should.eventually.equal(true);
      await isSizeMalformed({ height: 200, width: -200 }).should.eventually.equal(true);
    });
  });
});

const isCutlineMalformed = cutline => Promise.resolve(
  !geojsonValidation.isFeatureCollection(cutline)
);

const isExtentMalformed = extent => Promise.resolve(
  isNotObject(extent)
  || typeof extent.left !== 'number'
  || extent.left < -180
  || typeof extent.top !== 'number'
  || extent.top > 90
  || typeof extent.right !== 'number'
  || extent.right > 180
  || typeof extent.bottom !== 'number'
  || extent.bottom < -90
);

const isMarginMalformed = margin => Promise.resolve(
  isNotObject(margin)
  || margin.horizontal != null && isWholeNumberMalformed(margin.horizontal)
  || margin.vertical != null && isWholeNumberMalformed(margin.vertical)
);

const isSamplesMalformed = samples => Promise.resolve(
  isWholeNumberMalformed(samples)
);

const isSizeMalformed = size => Promise.resolve(
  isNotObject(size)
  || isWholeNumberMalformed(size.height)
  || isWholeNumberMalformed(size.width)
);

const isNotObject = v =>
  typeof v !== 'object'
  || Array.isArray(v)

const isWholeNumberMalformed = dimension =>
  typeof dimension !== 'number'
  || dimension % 1 !== 0
  || dimension < 0;

module.exports = {
  isCutlineMalformed,
  isExtentMalformed,
  isMarginMalformed,
  isSamplesMalformed,
  isSizeMalformed,
};