const blender = require('./blender');
const upperLefts = require('./upperLefts');
const heightmap = require('./heightmap');
const img = require('./img');

const promisify = require('util').promisify;
const fs = require('fs');
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

const metadataById = new Map();
const statusById = new Map();
const progressById = new Map();

const createShadedRelief = async ({
  id,
  cutline,
  extent,
  margin,
  size,
}) => {
  try {
    metadataById.set(id, { cutline, extent, size });
    statusById.set(id, { status: 'processing' });
    progressById.set(id, 0);
    const imgPaths = img.pathsFromUpperLefts(
      cutline
        ? await upperLefts.fromFeatureCollection(cutline)
        : upperLefts.fromExtent(extent)
    );
    await heightmap.generate({
      cutline,
      destination: `/tmp/${id}-heightmap.tif`,
      extent,
      id,
      imgPaths,
      margin,
      size,
    });
    await blender.renderShadedRelief({
      destination: `/tmp/${id}-#.tif`,
      id,
      onProgress: progress => progressById.set(id, progress),
      scale: 2.0,
      size,
      source: `/tmp/${id}-heightmap.tif`,
    });
    statusById.set(id, { status: 'fulfilled' });
  } catch (error) {
    statusById.set(id, { status: 'error', error: error.message });
  }
};

const getHeightmapById = async id => {
  const path = `/tmp/${id}-heightmap.tif`;
  return await exists(path) ? readFile(path) : null;
};

const getMetadataById = id => ({
  ...metadataById.get(id),
  ...statusById.get(id),
  progress: progressById.get(id),
});

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