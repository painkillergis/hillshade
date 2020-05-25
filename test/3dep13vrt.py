from subprocess import run
from osgeo.gdal import GDT_Byte, Rasterize, Unlink
import numpy as np
from uuid import uuid4


def test_should_build_vrt_from_cutline(tmpdir):
  vrt('test/cutline.json', 'test/3dep13.d', f'{tmpdir}/actual.vrt')
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
    f'{threeDepDirectory}/{img}-mini.img'
    for img in intersecting3DepIdsFromCutline(cutlineFile)
  ])


def test_intersecting_3dep_ids_from_cutline():
  assert intersecting3DepIdsFromCutline('test/cutline.json') == ['n49w124', 'n48w123', 'n49w123']


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
  return [f'n{y}w{abs(x)}' for x, y in upperLefts]
