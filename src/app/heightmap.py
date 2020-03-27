from osgeo import gdal, gdalconst, osr, ogr
from uuid import uuid4
import numpy as np
import json, sys

args = json.load(sys.stdin)

if 'margin' in args:
  marginVertical = args['margin']['vertical'] if 'vertical' in args['margin'] else 0
  marginHorizontal = args['margin']['horizontal'] if 'horizontal' in args['margin'] else 0
else:
  marginVertical = 0
  marginHorizontal = 0

warpPath = f'/vsimem/{uuid4()}.tif'
paddedWarpPath = f'/vsimem/{uuid4()}.tif'
cutlineAsFile = f'/tmp/{uuid4()}'

if 'cutline' in args:
  with open(cutlineAsFile, 'w') as f:
    json.dump(args['cutline'], f)
  warpDataSource = gdal.Warp(
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
  warpDataSource = gdal.Warp(
    warpPath,
    args['inRaster'],
    options = gdal.WarpOptions(
      outputBounds = [
        args['extent']['left'],
        args['extent']['bottom'],
        args['extent']['right'],
        args['extent']['top'],
      ],
      width = args['size']['width'],
      height = args['size']['height'],
      resampleAlg = 'bilinear',
    ),
  )

warpBand = warpDataSource.GetRasterBand(1)
warpBand.ComputeStatistics(0) # because USGS lies
srcMin, srcMax = warpBand.GetMinimum(), warpBand.GetMaximum()

if marginHorizontal or marginVertical:
  def padGeoTransform(geoTransform, marginHorizontal, marginVertical):
    left, widthResolution, i0, top, i1, heightResolution = geoTransform
    return (
      left - widthResolution * marginHorizontal,
      widthResolution,
      i0,
      top - heightResolution * marginVertical,
      i1,
      heightResolution,
    )
  paddedArray = np.pad(
    warpDataSource.ReadAsArray(),
    [(marginVertical,), (marginHorizontal,)],
    mode='constant',
    constant_values=0,
  )
  height, width = np.shape(paddedArray)
  paddedWarpDataSource = gdal.GetDriverByName('GTiff').Create(
    paddedWarpPath,
    width,
    height,
    1,
    warpDataSource.GetRasterBand(1).DataType,
  )
  paddedWarpDataSource.GetRasterBand(1).WriteArray(paddedArray)
  paddedWarpDataSource.GetRasterBand(1).SetNoDataValue(warpDataSource.GetRasterBand(1).GetNoDataValue())
  paddedWarpDataSource.SetGeoTransform(padGeoTransform(warpDataSource.GetGeoTransform(), marginHorizontal, marginVertical))
  paddedWarpDataSource.SetProjection(warpDataSource.GetProjection())
  warpDataSource = None
  gdal.Unlink(warpPath)
  gdal.Translate(
    args['outRaster'],
    paddedWarpDataSource,
    options = gdal.TranslateOptions(
      scaleParams = [[srcMin, srcMax, 8192, 65533]],
      outputType = gdalconst.GDT_UInt16,
    ),
  )
  paddedWarpDataSource = None
  gdal.Unlink(paddedWarpPath)
else:
  gdal.Translate(
    args['outRaster'],
    warpDataSource,
    options = gdal.TranslateOptions(
      scaleParams = [[srcMin, srcMax, 8192, 65533]],
      outputType = gdalconst.GDT_UInt16,
    ),
  )
  warpDataSource = None
  gdal.Unlink(warpPath)

print(args['outRaster'])