from osgeo import gdal, gdalconst
import sys

_, rasterInPath, rasterOutPath = sys.argv

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
    width = 128,
    height = 128,
    outputType = gdalconst.GDT_UInt16,
    scaleParams = [[srcMin, srcMax, 8192, 65533]],
    resampleAlg = 'bilinear',
  ),
)