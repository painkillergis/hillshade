from PIL import Image
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('destinationDirectory')
parser.add_argument('chunkWidth', type=int)
parser.add_argument('chunkHeight', type=int)
args = parser.parse_args()

heightmap = Image.open(args.heightmap)
width, height = heightmap.size
for y in range(0, int(height / args.chunkHeight)):
  for x in range(0, int(width / args.chunkWidth)):
    heightmap \
      .crop((
        (x - 1) * args.chunkWidth,
        (y - 1) * args.chunkHeight,
        (x + 2) * args.chunkWidth,
        (y + 2) * args.chunkHeight,
      )) \
      .save(f'{args.destinationDirectory}/{y}-{x}.tif')
