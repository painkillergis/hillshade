const exec = require('util').promisify(require('child_process').exec);

const build = ({ imgPaths, destination }) => exec(`gdalbuildvrt -overwrite ${destination} ${imgPaths.join(' ')}`);

module.exports = { build };