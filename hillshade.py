#!/usr/bin/env python3
import argparse, subprocess, sys

parser = argparse.ArgumentParser()
parser.add_argument('heightmap')
parser.add_argument('hillshade')
parser.add_argument('width', type = int)
parser.add_argument('height', type = int)
parser.add_argument('scale', type = float)
parser.add_argument('samples', type = int)
args = parser.parse_args()

subprocess.run(
  [
    "sh",
    "-c",
    f"blender -b -P ./blender.py -noaudio -o //{args.hillshade}  -f 0 -- {args.heightmap} {args.width} {args.height} 0 0 1 1 --scale {args.scale} --samples {args.samples}",
  ], 
  stdout = sys.stdout,
  stderr = sys.stderr,
)
