const blender = require('./blender');
const bounds = require('./bounds');
const heightmap = require('./heightmap');
const img = require('./img');

const readFile = require('util').promisify(require('fs').readFile);

const render = async ({
  id,
  extent,
  size,
}) => {
  const upperLefts = bounds.toUpperLefts(extent);
  const imgPaths = img.pathsFromUpperLefts(upperLefts);
  await heightmap.generate({ imgPaths, extent, size });
  await blender.renderShadedRelief({ id, size, scale: 2.0 });
  return getShadedReliefById(id);
};

const getShadedReliefById = id => readFile(`/tmp/${id}-0.tif`);

module.exports = ({
  getShadedReliefById,
  render,
});