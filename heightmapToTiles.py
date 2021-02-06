from PIL import Image
import argparse, math

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('destinationDirectory')
parser.add_argument('tileWidth', type=int)
parser.add_argument('tileHeight', type=int)
args = parser.parse_args()

def saveChunks(heightmap, destinationDirectory, tileWidth, tileHeight):
  heightmap = Image.open(heightmap)
  width, height = heightmap.size
  for y in range(0, math.ceil(height / tileHeight)):
    for x in range(0, math.ceil(width / tileWidth)):
      heightmap \
        .crop((
          (x - 1) * tileWidth,
          (y - 1) * tileHeight,
          (x + 2) * tileWidth,
          (y + 2) * tileHeight,
        )) \
        .save(f'{destinationDirectory}/{y}-{x}.tif')

saveChunks(args.heightmap, args.destinationDirectory, args.tileWidth, args.tileHeight)
