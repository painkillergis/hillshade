const blender = require('./blender');
const geoTransform = require('./geoTransform');
const heightmap = require('./heightmap');
const img = require('./img');
const upperLefts = require('./upperLefts');
const virtualDataset = require('./virtualDataset');

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
  margin = {},
  samples,
  scale,
  size,
  srid,
}) => {
  try {
    metadataById.set(id, { cutline, extent, size });
    statusById.set(id, { status: 'processing' });
    progressById.set(id, 0);
    await virtualDataset.build({
      destination: `/tmp/${id}-elevation.vrt`,
      imgPaths: img.pathsFromUpperLefts(
        cutline
          ? await upperLefts.fromFeatureCollection(cutline)
          : upperLefts.fromExtent(extent)
      ),
    });
    await heightmap.generate({
      cutline,
      destination: `/tmp/${id}-heightmap.tif`,
      extent,
      margin,
      size,
      source: `/tmp/${id}-elevation.vrt`,
      srid: srid || 'EPSG:4269',
    });
    await blender.renderShadedRelief({
      destination: `/tmp/${id}-#.tif`,
      id,
      onProgress: progress => progressById.set(id, progress),
      samples: samples || 64,
      scale: scale || 2.0,
      size: {
        width: size.width + (margin.horizontal || 0) * 2,
        height: size.height + (margin.vertical || 0) * 2,
      },
      source: `/tmp/${id}-heightmap.tif`,
    });
    await geoTransform.copy(
      `/tmp/${id}-heightmap.tif`,
      `/tmp/${id}-0.tif`,
    );
    statusById.set(id, { status: 'fulfilled' });
  } catch (error) {
    console.error(`Error fulfilling ${id}`, error);
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