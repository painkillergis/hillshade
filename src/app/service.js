const blender = require('./blender');
const upperLefts = require('./upperLefts');
const heightmap = require('./heightmap');
const img = require('./img');

const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

const metadataById = new Map();

const createShadedRelief = async ({
  id,
  cutline,
  extent,
  size,
}) => {
  try {
    metadataById.set(id, { cutline, extent, size, status: 'processing' });
    const imgPaths = img.pathsFromUpperLefts(
      cutline
        ? await upperLefts.fromFeatureCollection(cutline)
        : upperLefts.fromExtent(extent)
    );
    await heightmap.generate({
      cutline,
      extent,
      id,
      imgPaths,
      size,
    });
    await blender.renderShadedRelief({ id, size, scale: 2.0 });
    metadataById.set(id, { cutline, extent, size, status: 'fulfilled' });
  } catch (error) {
    metadataById.set(id, { cutline, extent, size, status: 'error', error: error.message });
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