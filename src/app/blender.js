const spawn = require('child_process').spawn;

const renderShadedRelief = ({
  destination,
  onProgress,
  scale,
  size: {
    width,
    height,
  },
  source,
}) => {
  const child = spawn(
    'blender',
    [
      '-b',
      '-P', 'src/app/blender.py',
      '-noaudio',
      '-o', `//${destination}`,
      '-f', '0',
      '--',
      source,
      width,
      height,
      scale,
    ]
  );
  const stderr = [];
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', data => stderr.push(data));
  child.stdout.setEncoding('utf8');
  const pattern = /(\d+)\/(\d+) Tiles/
  child.stdout.on('data', data => {
    const match = pattern.exec(data);
    if (match) {
      const [_, current, total] = match;
      onProgress(parseInt(current) / parseInt(total));
    }
  });
  return new Promise((resolve, reject) => {
    child.addListener('exit', code => code === 0 ? resolve() : reject(stderr.join('')));
  });
}

module.exports = { renderShadedRelief };