from osgeo import gdal, gdalconst
import json, sys

rasterInPath, rasterOutPath = sys.argv[1:3]
width, height = map(int, sys.argv[3:5])
left, top, right, bottom = map(float, sys.argv[5:9])

raster = gdal.Open(rasterInPath)
band = raster.GetRasterBand(1)
band.ComputeStatistics(0) # because USGS lies
srcMin, srcMax = map(
  lambda v: round(v, 3),
  [band.GetMinimum(), band.GetMaximum()],
)

gdal.Warp(
  '/tmp/warp.tif',
  rasterInPath,
  options = gdal.WarpOptions(
    outputBounds = [left, bottom, right, top],
    width = width,
    height = height,
    resampleAlg = 'bilinear',
  ),
)

gdal.Translate(
  rasterOutPath,
  '/tmp/warp.tif',
  options = gdal.TranslateOptions(
    scaleParams = [[srcMin, srcMax, 8192, 65533]],
    outputType = gdalconst.GDT_UInt16,
  ),
)