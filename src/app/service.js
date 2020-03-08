const blender = require('./blender');
const bounds = require('./bounds');
const heightmap = require('./heightmap');
const img = require('./img');

const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

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

const getShadedReliefById = async id => {
  const path = `/tmp/${id}-0.tif`;
  return await exists(path) ? readFile(path) : null;
}

module.exports = ({
  getShadedReliefById,
  render,
});