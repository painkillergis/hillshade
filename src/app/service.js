const blender = require('./blender');
const bounds = require('./bounds');
const heightmap = require('./heightmap');
const img = require('./img');

const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

const createShadedRelief = async ({
  id,
  extent,
  size,
}) => {
  const upperLefts = bounds.toUpperLefts(extent);
  const imgPaths = img.pathsFromUpperLefts(upperLefts);
  await heightmap.generate({ id, imgPaths, extent, size });
  await blender.renderShadedRelief({ id, size, scale: 2.0 });
};

const getShadedReliefById = async id => {
  const path = `/tmp/${id}-0.tif`;
  return await exists(path) ? readFile(path) : null;
};

const getHeightmapById = async id => {
  const path = `/tmp/${id}-heightmap.tif`;
  return await exists(path) ? readFile(path) : null;
}

module.exports = ({
  getHeightmapById,
  getShadedReliefById,
  createShadedRelief,
});