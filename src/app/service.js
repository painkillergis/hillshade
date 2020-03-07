const cp = require('child_process');
const blender = require('./blender');
const bounds = require('./bounds');
const heightmap = require('./heightmap');
const img = require('./img');

const render = async ({
  extent,
  size,
}) => {
  const upperLefts = bounds.toUpperLefts(extent);
  const imgPaths = img.pathsFromUpperLefts(upperLefts);
  cp.execSync(`gdalbuildvrt -overwrite /tmp/elevation.vrt ${imgPaths.join(' ')}`);
  await heightmap.generate({ extent, size });
  return blender.renderShadedRelief({ size, scale: 2.0 });
};

module.exports = ({
  render,
});