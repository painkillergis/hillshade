typeof describe === 'undefined' || describe('bounds', function () {
  require('chai').should();
  describe('toUpperLefts', function () {
    it('should include an upper left', function () {
      toUpperLefts({
        left: -99,
        top: 40,
        right: -98,
        bottom: 39,
      }).should.deep.equal([
        { lat: 40, lon: -99 },
      ]);
    });
    it('should include an upper left when top left have fractional parts', function () {
      toUpperLefts({
        left: -98.5,
        top: 39.5,
        right: -98,
        bottom: 39,
      }).should.deep.equal([
        { lat: 40, lon: -99 },
      ]);
    });
    it('should include upper lefts', function () {
      toUpperLefts({
        left: -91.5,
        top: 41.95,
        right: -89.25,
        bottom: 39.11,
      }).should.deep.equal([
        { lat: 42, lon: -92 },
        { lat: 41, lon: -92 },
        { lat: 40, lon: -92 },
        { lat: 42, lon: -91 },
        { lat: 41, lon: -91 },
        { lat: 40, lon: -91 },
        { lat: 42, lon: -90 },
        { lat: 41, lon: -90 },
        { lat: 40, lon: -90 },
      ]);
    });
  });
});

const toUpperLefts = ({ left, top, right, bottom }) => {
  const upperLefts = [];
  for (let lon = Math.floor(left); lon < right; lon++) {
    for (let lat = Math.ceil(top); lat > bottom; lat--) {
      upperLefts.push({ lat, lon });
    }
  }
  return upperLefts;
};

module.exports = {
  toUpperLefts,
};