from osgeo import gdal, gdalconst
import sys

if len(sys.argv) != 3:
  print('Usage: geoTransform_copy.py <source> <destination>')
  raise

source, destination = sys.argv[1:]

sourceDataSource = gdal.Open(source)
destinationDataSource = gdal.Open(destination, gdalconst.GA_Update)

destinationDataSource.SetGeoTransform(sourceDataSource.GetGeoTransform())
destinationDataSource.SetProjection(sourceDataSource.GetProjection())

destinationDataSource = None