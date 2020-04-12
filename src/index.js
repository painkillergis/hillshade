const exec = require('child_process').exec;
if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
const requireGdalBuildVrt = new Promise(
  (resolve, reject) => exec(
    'which gdalbuildvrt',
    error => error ? reject(error) : resolve(),
  ),
);
requireGdalBuildVrt
  .then(() => require('./app').listen(8080, () => console.log('0.0.0.0:8080')))
  .catch(error => console.error('There was an error finding gdalbuildvrt. Is GDAL installed?\n', error))
process.on('SIGINT', () => process.exit());
