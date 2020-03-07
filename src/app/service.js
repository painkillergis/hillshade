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
  await heightmap.generate({ imgPaths, extent, size });
  return blender.renderShadedRelief({ size, scale: 2.0 });
};

module.exports = ({
  render,
});