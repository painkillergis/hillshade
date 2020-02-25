from osgeo import gdal, gdalconst
import sys

rasterInPath, rasterOutPath, width, height = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

raster = gdal.Open(rasterInPath)
band = raster.GetRasterBand(1)
band.ComputeStatistics(0) # because USGS lies
srcMin, srcMax = map(
  lambda v: round(v, 3),
  [band.GetMinimum(), band.GetMaximum()],
)

gdal.Translate(
  rasterOutPath,
  rasterInPath,
  options = gdal.TranslateOptions(
    width = width,
    height = height,
    outputType = gdalconst.GDT_UInt16,
    scaleParams = [[srcMin, srcMax, 8192, 65533]],
    resampleAlg = 'bilinear',
  ),
)