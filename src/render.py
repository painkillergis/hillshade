import bpy, math, sys

scriptsArgs = sys.argv[sys.argv.index("--") + 1:]
if len(scriptsArgs) != 3:
  print('Usage: blender ... -- <width> <height> <scale>')
  raise
width, height, scale = int(scriptsArgs[0]), int(scriptsArgs[1]), float(scriptsArgs[2])

for scene in bpy.data.scenes:
  scene.render.engine = 'CYCLES'
  scene.cycles.device = 'GPU'
  scene.cycles.samples = 64
  scene.cycles.feature_set = 'EXPERIMENTAL'
  scene.cycles.use_adaptive_subdivision = True
  scene.cycles.displacement_method = 'TRUE'
  scene.render.resolution_x = width
  scene.render.resolution_y = height
  scene.render.image_settings.file_format = 'TIFF'
  scene.render.image_settings.color_mode = 'BW'
  scene.render.image_settings.color_depth = '8'
  scene.camera.location = (0.0, 0.0, 100.0)
  scene.camera.rotation_euler = (0.0, 0.0, 0.0)

bpy.context.preferences.addons['cycles'].preferences.compute_device_type = 'CUDA'

bpy.data.cameras['Camera'].type = 'ORTHO'
bpy.data.cameras['Camera'].ortho_scale = max(width / height, 1) * 2

bpy.data.lights['Light'].type = 'SUN'
bpy.data.lights['Light'].angle = math.radians(90)
bpy.data.lights['Light'].energy = 5
bpy.data.objects['Light'].rotation_euler = (0, 45, 135)

bpy.data.objects.remove(bpy.data.objects['Cube'], do_unlink=True)
bpy.ops.mesh.primitive_plane_add()
bpy.data.objects['Plane'].scale = (width / height, 1, 1)
material = bpy.data.materials.new(name = 'Material')
material.use_nodes = True
bpy.data.objects['Plane'].data.materials.append(material)
outputNode = material.node_tree.nodes.get('Material Output')
displacementNode = material.node_tree.nodes.new('ShaderNodeDisplacement')
displacementNode.inputs['Scale'].default_value = scale
imageNode = material.node_tree.nodes.new('ShaderNodeTexImage')
imageNode.image = bpy.data.images.load('/tmp/translate.tif')
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

# bpy.ops.render.render(write_still=True)