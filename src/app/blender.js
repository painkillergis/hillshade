const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);
const readFile = promisify(require('fs').readFile);

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
  '-P src/app/render.py',
  '-noaudio',
  `-o ///tmp/${id}-#.tif`,
  '-f 0',
  '--',
  width,
  height,
  scale,
].join(' '));

module.exports = { renderShadedRelief };