from argparse import ArgumentParser
import bpy, math, sys

parser = ArgumentParser(
  usage = '%(prog)s -P blender.py -- [-h] [options]'
)
parser.add_argument('heightmap')
parser.add_argument('width', type = int)
parser.add_argument('height', type = int)
parser.add_argument('--scale', type = float, default = 1)
parser.add_argument('--samples', type = int, default = 64)
parser.add_argument('--chunks', type = bool)
parser.add_argument('--mainfile')

args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])

for scene in bpy.data.scenes:
  scene.render.engine = 'CYCLES'
  scene.cycles.device = 'GPU'
  scene.cycles.samples = args.samples
  scene.cycles.feature_set = 'EXPERIMENTAL'
  scene.render.resolution_x = args.width
  scene.render.resolution_y = args.height
  scene.render.image_settings.file_format = 'TIFF'
  scene.render.image_settings.color_mode = 'BW'
  scene.render.image_settings.color_depth = '16'
  if args.chunks:
    scene.render.use_border = True
    scene.render.use_crop_to_border = True
    scene.render.border_min_x = 1 / 3
    scene.render.border_max_x = 2 / 3
    scene.render.border_min_y = 1 / 3
    scene.render.border_max_y = 2 / 3
  scene.camera.location = (0.0, 0.0, 100.0)
  scene.camera.rotation_euler = (0.0, 0.0, 0.0)

bpy.context.preferences.addons['cycles'].preferences.compute_device_type = 'CUDA'
bpy.context.preferences.addons['cycles'].preferences.get_devices()

bpy.data.cameras['Camera'].type = 'ORTHO'
bpy.data.cameras['Camera'].ortho_scale = max(args.width / args.height, 1) * 2

bpy.data.lights['Light'].type = 'SUN'
bpy.data.lights['Light'].angle = math.radians(90)
bpy.data.lights['Light'].energy = 5
bpy.data.objects['Light'].rotation_euler = (
  math.radians(0),
  math.radians(75),
  math.radians(135),
)

bpy.data.objects.remove(bpy.data.objects['Cube'], do_unlink=True)
bpy.ops.mesh.primitive_plane_add()
bpy.data.objects['Plane'].scale = (args.width / args.height, 1, 1)
bpy.data.objects['Plane'].location = (0, 0, 1)
bpy.data.objects['Plane'].cycles.use_adaptive_subdivision = True
material = bpy.data.materials.new(name = 'Material')
material.cycles.displacement_method = 'DISPLACEMENT'
material.use_nodes = True
bpy.data.objects['Plane'].data.materials.append(material)
outputNode = material.node_tree.nodes.get('Material Output')
displacementNode = material.node_tree.nodes.new('ShaderNodeDisplacement')
displacementNode.inputs['Scale'].default_value = args.scale
imageNode = material.node_tree.nodes.new('ShaderNodeTexImage')
imageNode.image = bpy.data.images.load(args.heightmap)
imageNode.image.colorspace_settings.name = 'Linear'
imageNode.extension = 'EXTEND'
imageNode.interpolation = 'Smart'
principledBsdfNode = material.node_tree.nodes.get('Principled BSDF')
principledBsdfNode.inputs['Roughness'].default_value = 1.0
principledBsdfNode.inputs['Specular'].default_value = 0.0
principledBsdfNode.inputs['Base Color'].default_value = [0.6, 0.6, 0.6, 0]
material.node_tree.links.new(outputNode.inputs['Displacement'], displacementNode.outputs['Displacement'])
material.node_tree.links.new(displacementNode.inputs['Height'], imageNode.outputs['Color'])
bpy.data.objects['Plane'].modifiers.new('Subsurf', 'SUBSURF')
bpy.data.objects['Plane'].modifiers['Subsurf'].subdivision_type = 'SIMPLE'

if args.mainfile:
  bpy.ops.wm.save_as_mainfile(filepath = args.mainfile)
