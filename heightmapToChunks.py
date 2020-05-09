from PIL import Image
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('destinationDirectory')
args = parser.parse_args()

heightmap = Image.open(args.heightmap)
width, height = heightmap.size
for y in range(0, 4):
  for x in range(0, 4):
    left = max((x - 1) * 16, 0)
    right = min((x + 2) * 16, width)
    top = max((y - 1) * 16, 0)
    bottom = min((y + 2) * 16, height)
    chunk = heightmap.crop((left, top, right, bottom))
    chunk.save(f'{args.destinationDirectory}/{y}-{x}.tif')
