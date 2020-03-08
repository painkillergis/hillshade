const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);

const generate = async ({
  extent: {
    left,
    top,
    right,
    bottom,
  },
  id,
  imgPaths,
  size: {
    width,
    height,
  },
}) => {
  await exec([
    'gdalbuildvrt',
    '-overwrite',
    `/tmp/${id}-elevation.vrt`,
    ...imgPaths,
  ].join(' '))
  await exec([
    'python',
    'src/app/heightmap.py',
    `/tmp/${id}-elevation.vrt`,
    `/tmp/${id}-heightmap.tif`,
    width,
    height,
    left,
    top,
    right,
    bottom
  ].join(' '))
}

module.exports = { generate };