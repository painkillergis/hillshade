const spawn = require('child_process').spawn;

const childToPromise = child => new Promise((resolve, reject) => {
  const stdout = [];
  const stderr = [];
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', data => stdout.push(data))
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', data => stderr.push(data))
  child.addListener('exit', () => {
    const stderrLines = stderr
      .join('')
      .split('\\n')
      .filter(line => !line.startsWith('TIFFReadDirectory'));

    stderrLines.length > 0 ? reject(Error(stderrLines.join(''))) : resolve(stdout.join(''))
  });
});

const renderShadedRelief = ({
  destination,
  onProgress,
  samples,
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
      samples,
      1,
      0
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
  return childToPromise(child);
}

module.exports = { renderShadedRelief };
