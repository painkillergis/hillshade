const promisify = require('util').promisify
const exec = promisify(require('child_process').exec);
const readFile = promisify(require('fs').readFile);

const renderShadedRelief = ({
  size: {
    width,
    height,
  },
  scale,
}) => exec(
  [
    'blender',
    '-b',
    '-P src/app/render.py',
    '-noaudio',
    '-o ///tmp/shaded-relief-#.tif',
    '-f 0',
    '--',
    width,
    height,
    scale,
  ].join(' '),
)
  .then(() => readFile('/tmp/shaded-relief-0.tif'));

module.exports = { renderShadedRelief };