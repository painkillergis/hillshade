from PIL import Image
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('destinationDirectory')
parser.add_argument('chunkWidth', type=int)
parser.add_argument('chunkHeight', type=int)
args = parser.parse_args()

def saveChunks(heightmap, destinationDirectory, chunkWidth, chunkHeight):
  heightmap = Image.open(heightmap)
  width, height = heightmap.size
  for y in range(0, int(height / chunkHeight)):
    for x in range(0, int(width / chunkWidth)):
      heightmap \
        .crop((
          (x - 1) * chunkWidth,
          (y - 1) * chunkHeight,
          (x + 2) * chunkWidth,
          (y + 2) * chunkHeight,
        )) \
        .save(f'{destinationDirectory}/{y}-{x}.tif')

saveChunks(args.heightmap, args.destinationDirectory, args.chunkWidth, args.chunkHeight)
