#!/usr/bin/env python
import os, re
from PIL import Image
from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument("hillshade_tiles_dir")
parser.add_argument("destination")
args = parser.parse_args()

def fileToTile(file):
  matcher = re.search('0-(\d+)-(\d+).tif', file)
  return (int(matcher.group(1)), int(matcher.group(2)), file)

files = os.listdir(args.hillshade_tiles_dir)
tiles = list(map(fileToTile, files))

right = max(map(lambda tile: tile[0], tiles))
bottom = max(map(lambda tile: tile[1], tiles))

tileWidth = Image.open(f"{args.hillshade_tiles_dir}/{files[0]}").size[0]
result = Image.new("I;16", (tileWidth * right, tileWidth * bottom))

for tile in tiles:
  (y, x, file) = tile
  result.paste(Image.open(f"{args.hillshade_tiles_dir}/{file}"), box = (x * tileWidth, y * tileWidth))

result.save(args.destination)
