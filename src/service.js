const cp = require('child_process');
const fs = require('fs');
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
  cp.execSync(`python src/translate.py /tmp/elevation.vrt /tmp/translate.tif ${width} ${height} ${left} ${top} ${right} ${bottom}`, { stdio: 'inherit' });
  cp.execSync(`blender -b -P src/render.py -noaudio -o ///tmp/shaded-relief-#.tif -f 0 -- ${width} ${height} 2.0`, { stdio: 'inherit' });
  return fs.readFileSync('/tmp/shaded-relief-0.tif');
};

module.exports = ({
  render,
});