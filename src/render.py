import bpy

bpy.context.preferences.addons['cycles'].preferences.compute_device_type = 'CUDA'

for scene in bpy.data.scenes:
  scene.cycles.device = 'GPU'
  scene.cycles.samples = 64
  scene.cycles.feature_set = 'EXPERIMENTAL'
  scene.cycles.use_adaptive_subdivision = True
  scene.cycles.displacement_method = 'TRUE'
  scene.render.engine = 'CYCLES'
  scene.render.resolution_x = 128
  scene.render.resolution_y = 128
  scene.render.image_settings.file_format = 'TIFF'
  scene.render.image_settings.color_mode = 'BW'
  scene.render.image_settings.color_depth = '8'
  scene.camera.location = (0.0, 0.0, 100.0)
  scene.camera.rotation_euler = (0.0, 0.0, 0.0)

bpy.data.cameras['Camera'].type = 'ORTHO'
bpy.data.cameras['Camera'].ortho_scale = 2
bpy.context.scene.camera

bpy.data.objects.remove(bpy.data.objects['Cube'], do_unlink=True)
bpy.ops.mesh.primitive_plane_add()
material = bpy.data.materials.new(name = 'Material')
material.use_nodes = True
bpy.data.objects['Plane'].data.materials.append(material)
# set BSDF shit?
outputNode = material.node_tree.nodes.get('Material Output')
displacementNode = material.node_tree.nodes.new('ShaderNodeDisplacement')
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