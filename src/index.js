if (!process.env.IMG_DIRECTORY) throw Error('Environment variable IMG_DIRECTORY must be set');
require('./app').listen(8080, () => console.log('0.0.0.0:8080'));