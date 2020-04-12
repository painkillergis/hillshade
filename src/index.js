const exec = require('child_process').exec;
if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
const which = name => new Promise(
  (resolve, reject) => exec(
    `which ${name}`,
    error => error ? reject(error) : resolve(),
  ),
)
Promise.all([
  which('blender'),
  which('gdalbuildvrt'),
])
  .then(() => require('./app').listen(8080, () => console.log('0.0.0.0:8080')))
  .catch(error => console.error(error))
process.on('SIGINT', () => process.exit());
