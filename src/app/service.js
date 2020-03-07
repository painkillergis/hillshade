const cp = require('child_process');
const blender = require('./blender');
const bounds = require('./bounds');
const img = require('./img');

const render = async ({
  extent,
  size: { width, height },
}) => {
  const { left, top, right, bottom } = extent;
  const upperLefts = bounds.toUpperLefts(extent);
  const imgPaths = img.pathsFromUpperLefts(upperLefts);
  cp.execSync(`gdalbuildvrt -overwrite /tmp/elevation.vrt ${imgPaths.join(' ')}`);
  cp.execSync(`python src/app/translate.py /tmp/elevation.vrt /tmp/translate.tif ${width} ${height} ${left} ${top} ${right} ${bottom}`, { stdio: 'inherit' });

  return blender.renderShadedRelief({ size: { width, height }, scale: 2.0 });
};

module.exports = ({
  render,
});