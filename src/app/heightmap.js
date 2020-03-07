const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);

const generate = ({
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
}) => exec(
  [
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
  ].join(' '),
);

module.exports = { generate };