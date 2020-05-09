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
    left = max((x - 1) * args.chunkWidth, 0)
    right = min((x + 2) * args.chunkWidth, width)
    top = max((y - 1) * args.chunkHeight, 0)
    bottom = min((y + 2) * args.chunkHeight, height)
    chunk = heightmap.crop((left, top, right, bottom))
    chunk.save(f'{args.destinationDirectory}/{y}-{x}.tif')
