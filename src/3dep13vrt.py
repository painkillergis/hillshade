from subprocess import run
from osgeo.gdal import GDT_Byte, Rasterize, Unlink
import numpy as np
from uuid import uuid4


def test_should_build_vrt_from_cutline(tmpdir):
  vrt('test/cutline-seattle.json', 'test/3dep13.d', f'{tmpdir}/actual.vrt')
  with open(f'{tmpdir}/actual.vrt', 'r') as file:
    actualVrt = file.read()
  with open('test/expected.vrt', 'r') as file:
    expectedVrt = file.read()
  assert actualVrt == expectedVrt


def vrt(cutlineFile, threeDepDirectory, destinationFile):
  run([
    'gdalbuildvrt',
    destinationFile
  ] + [
    f'{threeDepDirectory}/USGS_NED_13_{img}_IMG.img'
    for img in intersecting3DepIdsFromCutline(cutlineFile)
  ])


def test_intersecting_3dep_ids_from_cutline():
  assert intersecting3DepIdsFromCutline('test/cutline-seattle.json') == ['n49w124', 'n48w123', 'n49w123']
  assert intersecting3DepIdsFromCutline('test/cutline-0-0.json') == [
    's01w001',
    'n00w001',
    'n01w001',
    's01e000',
    'n00e000',
    'n01e000',
    's01e001',
    'n00e001',
    'n01e001',
  ]


def intersecting3DepIdsFromCutline(cutlineFile):
  with open(cutlineFile, 'r') as f:
    cutline = f.read()
  gridPath = f'/vsimem/{uuid4()}'
  grid = Rasterize(
    gridPath,
    cutline,
    xRes = 1,
    yRes = -1,
    allTouched = True,
    outputBounds = [-180, -90, 180, 90],
    burnValues = 1,
    outputType = GDT_Byte,
  )
  gridMask = grid.ReadAsArray()
  grid = None
  Unlink(gridPath)
  yIndices, xIndices = np.where(gridMask == 1)
  upperLefts = [(int(-180 + x), int(90 - y)) for x, y in zip(xIndices, yIndices)]
  upperLefts = sorted(upperLefts, key=lambda xy: xy[1])
  upperLefts = sorted(upperLefts, key=lambda xy: xy[0])
  return list(map(upperLeftTo3DepId, upperLefts))


def test_upper_left_to_3dep_id():
  assert upperLeftTo3DepId((-100, 10)) == 'n10w100'
  assert upperLeftTo3DepId((-10, 10)) == 'n10w010'
  assert upperLeftTo3DepId((-10, 1)) == 'n01w010'
  assert upperLeftTo3DepId((10, 1)) == 'n01e010'
  assert upperLeftTo3DepId((10, -1)) == 's01e010'
  assert upperLeftTo3DepId((0, 0)) == 'n00e000'


def upperLeftTo3DepId(lonLat):
  x, y = lonLat
  return f'{"s" if y < 0 else "n"}{abs(y):02}{"w" if x < 0 else "e"}{abs(x):03}'
