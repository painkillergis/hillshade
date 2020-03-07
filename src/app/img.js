typeof describe === 'undefined' || describe('img', function () {
  require('chai').should();
  const rimraf = require('rimraf');
  const { closeSync, mkdirSync, openSync } = require('fs');
  describe('pathsFromUpperLefts', function () {
    let temporaryDirectory = '/tmp/painkiller-img-test';
    before(function () {
      mkdirSync(temporaryDirectory);
      process.env.IMG_DIRECTORY = temporaryDirectory;
    })
    it('should returns paths to heightmaps matching upper lefts', function () {
      [
        'USGS_NED_13_n70w153_IMG.img',
        'USGS_NED_13_n71w143_IMG.img',
        'imgn71w144_13.img',
        'USGS_NED_13_n71w145_IMG.img',
        'USGS_NED_13_n71w146_IMG.img',
        'USGS_NED_13_n71w147_IMG.img',
        'USGS_NED_13_n71w148_IMG.img',
        'USGS_NED_13_s01w149_IMG.img',
        'USGS_NED_13_n71w150_IMG.img',
        'USGS_NED_13_n71w151_IMG.img',
      ].forEach(name => closeSync(openSync(`${temporaryDirectory}/${name}`, 'w')));

      pathsFromUpperLefts([
        {
          lat: 71,
          lon: -144,
        },
        {
          lat: 71,
          lon: -145,
        },
        {
          lat: -1,
          lon: -149,
        },
      ]).should.deep.equal([
        `${temporaryDirectory}/USGS_NED_13_n71w145_IMG.img`,
        `${temporaryDirectory}/USGS_NED_13_s01w149_IMG.img`,
        `${temporaryDirectory}/imgn71w144_13.img`,
      ]);
    });
    after(function () {
      rimraf.sync(temporaryDirectory);
    })
  });
  describe('upperLeftToId', function () {
    it('should return id for northwestern hemisphere', function () {
      upperLeftToId({ lat: 20, lon: -40 }).should.equal('n20w040');
      upperLeftToId({ lat: 20, lon: -170 }).should.equal('n20w170');
      upperLeftToId({ lat: 20, lon: -1 }).should.equal('n20w001');
    });
    it('should return id for southwestern hemisphere', function () {
      upperLeftToId({ lat: -1, lon: -40 }).should.equal('s01w040');
      upperLeftToId({ lat: -20, lon: -170 }).should.equal('s20w170');
    });
    it('should return id for southeastern hemisphere', function () {
      upperLeftToId({ lat: -1, lon: 40 }).should.equal('s01e040');
      upperLeftToId({ lat: -20, lon: 170 }).should.equal('s20e170');
    });
  });
});

const { readdirSync } = require('fs');

const pathsFromUpperLefts = upperLefts => {
  return readdirSync(process.env.IMG_DIRECTORY)
    .filter(name => upperLefts.some(
      upperLeft => name.indexOf(upperLeftToId(upperLeft)) > -1
    ))
    .map(name => `${process.env.IMG_DIRECTORY}/${name}`)
}

const upperLeftToId = ({ lat, lon }) => [
  lat < 0 ? 's' : 'n',
  Math.abs(lat).toString().padStart(2, '0'),
  lon < 0 ? 'w' : 'e',
  Math.abs(lon).toString().padStart(3, '0'),
].join('');

module.exports = ({
  pathsFromUpperLefts,
});