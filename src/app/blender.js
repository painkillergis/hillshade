const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);

const renderShadedRelief = async ({
  id,
  size: {
    width,
    height,
  },
  scale,
}) => exec([
  'blender',
  '-b',
  '-P src/app/blender.py',
  '-noaudio',
  `-o ///tmp/${id}-#.tif`,
  '-f 0',
  '--',
  `/tmp/${id}-heightmap.tif`,
  width,
  height,
  scale,
].join(' '));

module.exports = { renderShadedRelief };