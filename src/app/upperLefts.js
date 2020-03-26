typeof describe === 'undefined' || describe('bounds', function () {
  require('chai').should();
  describe('fromExtent', function () {
    it('should include an upper left', function () {
      fromExtent({
        left: -99,
        top: 40,
        right: -98,
        bottom: 39,
      }).should.deep.equal([
        { lat: 40, lon: -99 },
      ]);
    });
    it('should include an upper left when top left have fractional parts', function () {
      fromExtent({
        left: -98.5,
        top: 39.5,
        right: -98,
        bottom: 39,
      }).should.deep.equal([
        { lat: 40, lon: -99 },
      ]);
    });
    it('should include upper lefts', function () {
      fromExtent({
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
  describe('fromFeatureCollection', function () {
    it('should include an upper left', async function () {
      const featureCollection = {
        type: 'FeatureCollection',
        name: 'cutline',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        },
        features: [{
          type: 'Feature',
          properties: {
            id: null
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[
              [-98.90216954661751,
                47.7956910847549],
              [-98.78680134632724,
                47.794844603763806],
              [-98.76910569067988,
                47.77466954033169],
              [-98.79230282819937,
                47.7461652095241],
              [-98.90235068056387,
                47.74869588814863],
              [-98.93943909892864,
                47.776015190720294],
              [-98.90216954661751,
                47.7956910847549]
            ]]]
          }
        }]
      };

      await fromFeatureCollection(featureCollection).should.eventually.deep.equal([
        { lat: 48, lon: -99 },
      ]);
    });
  });
});

const spawnSync = require('child_process').spawnSync;

const fromExtent = ({ left, top, right, bottom }) => {
  const upperLefts = [];
  for (let lon = Math.floor(left); lon < right; lon++) {
    for (let lat = Math.ceil(top); lat > bottom; lat--) {
      upperLefts.push({ lat, lon });
    }
  }
  return upperLefts;
};

const fromFeatureCollection = async featureCollection => {
  const { stdout } = spawnSync(
    'python',
    ['src/app/upperLefts_fromFeatureCollection.py'],
    {
      input: JSON.stringify(featureCollection),
      encoding: 'utf8'
    },
  );
  return JSON.parse(stdout);
}

module.exports = {
  fromExtent,
  fromFeatureCollection,
};