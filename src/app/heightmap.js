const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);

const generate = async ({
  size: {
    width,
    height,
  },
  extent: {
    left,
    top,
    right,
    bottom,
  },
  imgPaths,
}) => {
  await exec([
    'gdalbuildvrt',
    '-overwrite',
    '/tmp/elevation.vrt',
    ...imgPaths,
  ].join(' '))
  await exec([
    'python',
    'src/app/translate.py',
    '/tmp/elevation.vrt',
    '/tmp/heightmap.tif',
    width,
    height,
    left,
    top,
    right,
    bottom
  ].join(' '))
}

module.exports = { generate };