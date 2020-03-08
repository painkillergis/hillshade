const blender = require('./blender');
const bounds = require('./bounds');
const heightmap = require('./heightmap');
const img = require('./img');

const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

const metadataById = new Map();

const createShadedRelief = async ({
  id,
  extent,
  size,
}) => {
  try {
    metadataById.set(id, { extent, size, status: 'processing' });
    const upperLefts = bounds.toUpperLefts(extent);
    const imgPaths = img.pathsFromUpperLefts(upperLefts);
    await heightmap.generate({ id, imgPaths, extent, size });
    await blender.renderShadedRelief({ id, size, scale: 2.0 });
    metadataById.set(id, { extent, size, status: 'fulfilled' });
  } catch (error) {
    metadataById.set(id, { extent, size, status: 'error', error: error.message });
  }
};

const getHeightmapById = async id => {
  const path = `/tmp/${id}-heightmap.tif`;
  return await exists(path) ? readFile(path) : null;
};

const getMetadataById = id => metadataById.get(id);

const getShadedReliefById = async id => {
  const path = `/tmp/${id}-0.tif`;
  return await exists(path) ? readFile(path) : null;
};

module.exports = ({
  getHeightmapById,
  getMetadataById,
  getShadedReliefById,
  createShadedRelief,
});