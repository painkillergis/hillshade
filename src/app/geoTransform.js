const spawn = require('child_process').spawn;

const childToPromise = child => new Promise((resolve, reject) => {
  const stdout = [];
  const stderr = [];
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', data => stdout.push(data))
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', data => stderr.push(data))
  child.addListener('exit', () => stderr.length > 0 ? reject(Error(stderr.join(''))) : resolve(stdout.join('')));
});

const copy = (source, destination) => childToPromise(
  spawn(
    'python',
    ['src/app/geoTransform_copy.py', source, destination],
  )
);

module.exports = { copy }