const spawn = require('child_process').spawn;

const renderShadedRelief = ({
  id,
  size: {
    width,
    height,
  },
  scale,
}) => {
  const child = spawn(
    'blender',
    [
      '-b',
      '-P', 'src/app/blender.py',
      '-noaudio',
      '-o', `///tmp/${id}-#.tif`,
      '-f', '0',
      '--',
      `/tmp/${id}-heightmap.tif`,
      width,
      height,
      scale,
    ]
  );
  const stderr = [];
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', data => stderr.push(data));
  return new Promise((resolve, reject) => {
    child.addListener('exit', code => code === 0 ? resolve() : reject(stderr.join('')));
  });
}

module.exports = { renderShadedRelief };