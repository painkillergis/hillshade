const spawn = require('child_process').spawn;

const childToPromise = child => new Promise((resolve, reject) => {
  const stdout = [];
  const stderr = []
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', data => stdout.push(data))
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', data => stderr.push(data))
  child.addListener(
    'exit',
    code => code > 0
      ? reject(Error(stderr.join('')))
      : resolve(stdout.join('')),
  );
});

const generate = ({
  cutline,
  destination,
  extent,
  margin,
  size,
  source,
}) => {
  const child = spawn('python', ['src/app/heightmap.py']);
  child.stdin.write(
    JSON.stringify({
      cutline,
      extent,
      inRaster: source,
      margin,
      outRaster: destination,
      size,
    }),
  );
  child.stdin.end();
  return childToPromise(child);
}

module.exports = { generate };