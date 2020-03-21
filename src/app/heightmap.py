from osgeo import gdal, gdalconst
from uuid import uuid4
import json, sys

args = json.load(sys.stdin)
warpPath = ''.join(['/vsimem/', args['outRaster'], '.warp.tif'])

raster = gdal.Open(args['inRaster'])
band = raster.GetRasterBand(1)
band.ComputeStatistics(0) # because USGS lies
srcMin, srcMax = map(
  lambda v: round(v, 3),
  [band.GetMinimum(), band.GetMaximum()],
)

if args['cutline']:
  cutlineAsFile = f'/tmp/{uuid4()}'
  with open(cutlineAsFile, 'w') as f:
    json.dump(args['cutline'], f)
  gdal.Warp(
    warpPath,
    args['inRaster'],
    options = gdal.WarpOptions(
      width = args['size']['width'],
      height = args['size']['height'],
      resampleAlg = 'bilinear',
      cutlineDSName = cutlineAsFile,
      cropToCutline = True,
    ),
  )
  gdal.Unlink(cutlineAsFile)
else:
  gdal.Warp(
    warpPath,
    args['inRaster'],
    options = gdal.WarpOptions(
      outputBounds = [args['extent']['left'], args['extent']['bottom'], args['extent']['right'], args['extent']['top']],
      width = args['size']['width'],
      height = args['size']['height'],
      resampleAlg = 'bilinear',
    ),
  )

gdal.Translate(
  args['outRaster'],
  warpPath,
  options = gdal.TranslateOptions(
    scaleParams = [[srcMin, srcMax, 8192, 65533]],
    outputType = gdalconst.GDT_UInt16,
  ),
)

gdal.Unlink(warpPath)
print(args['outRaster'])