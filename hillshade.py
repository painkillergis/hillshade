#!/usr/bin/env python
from PIL import Image
import argparse, json, os, requests, subprocess, sys

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('heightmapTilesDir')
parser.add_argument('hillshadeTilesDir')
parser.add_argument('hillshade')
parser.add_argument('tileWidth', type = int)
parser.add_argument('tileHeight', type = int)
parser.add_argument('overlap', type = int)
parser.add_argument('scale', type = int)
parser.add_argument('samples', type = int)
args = parser.parse_args()

heightmap = Image.open(args.heightmap)

tileMetadatas = requests.post(
  'http://painkiller.arctair.com/layouts/tiles',
  json = {
    "size": {
      "width": heightmap.size[0],
      "height": heightmap.size[1],
    },
    "tileSize": {
      "width": args.tileWidth,
      "height": args.tileHeight,
    },
    "overlap": args.overlap,
  },
) \
  .json()

os.makedirs(args.heightmapTilesDir, exist_ok = True)
os.makedirs(args.hillshadeTilesDir, exist_ok = True)

for tileMetadata in tileMetadatas:
  xIndex = tileMetadata['indices']['x']
  yIndex = tileMetadata['indices']['y']

  left = tileMetadata['bounds']['left']
  top = tileMetadata['bounds']['top']
  right = tileMetadata['bounds']['right']
  bottom = tileMetadata['bounds']['bottom']

  heightmapTilePath = f"{args.heightmapTilesDir}/{xIndex}-{yIndex}.tif"
  if os.path.exists(heightmapTilePath):
    print(f"skipping heightmap generation for {heightmapTilePath}")
  else:
    tile = heightmap.crop((left, top, right, bottom))
    tile.save(heightmapTilePath)

  hillshadeTilePath = f"{args.hillshadeTilesDir}/#-{xIndex}-{yIndex}.tif"
  if os.path.exists(hillshadeTilePath.replace('#', '0')):
    print(f"skipping hillshade generation for {hillshadeTilePath.replace('#', '0')}")
    continue

  innerLeft = tileMetadata['innerBounds']['left']
  innerTop = tileMetadata['innerBounds']['top']
  innerRight = tileMetadata['innerBounds']['right']
  innerBottom = tileMetadata['innerBounds']['bottom']

  width = tileMetadata['size']['width']
  height = tileMetadata['size']['height']

  borderLeft = (innerLeft - left) / width
  borderTop = 1 - (innerBottom - top) / height
  borderRight = (innerRight - left) / width
  borderBottom = 1 - (innerTop - top) / height

  subprocess.run(
    [
      "sh",
      "-c",
      f"blender -b -P ~/ws/painkillergis/blender/blender.py -noaudio -o //{hillshadeTilePath}  -f 0 -- {heightmapTilePath} {width} {height} {borderLeft} {borderTop} {borderRight} {borderBottom} --scale {args.scale} --samples {args.samples}",
    ], 
    stdout = sys.stdout,
    stderr = sys.stderr,
  )

subprocess.run(
  [
    "sh",
    "-c",
    f"python ~/ws/painkillergis/blender/stitch.py {args.hillshadeTilesDir} {args.hillshade}",
  ],
  stdout = sys.stdout,
  stderr = sys.stderr,
)

subprocess.run(
  [
    "sh",
    "-c",
    f"python ~/ws/painkillergis/blender/copyGeotransform.py {args.heightmap} {args.hillshade}",
  ],
  stdout = sys.stdout,
  stderr = sys.stderr,
)
