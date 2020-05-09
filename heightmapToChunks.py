from PIL import Image

heightmap = Image.open('heightmap.tif')
width, height = heightmap.size
for y in range(0, 4):
  for x in range(0, 4):
    left = max((x - 1) * 16, 0)
    right = min((x + 2) * 16, width)
    top = max((y - 1) * 16, 0)
    bottom = min((y + 2) * 16, height)
    chunk = heightmap.crop((left, top, right, bottom))
    chunk.save(f'chunks.d/{y}-{x}.tif')
