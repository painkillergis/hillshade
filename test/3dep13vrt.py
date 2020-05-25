from subprocess import run


def vrt(threeDepDirectory, destinationFile):
  run([
    'gdalbuildvrt',
    destinationFile
  ] + [
    f'{threeDepDirectory}/{img}-mini.img'
    for img in ['n48w123', 'n49w123', 'n49w124']
  ])


def test_should_build_vrt_from_static_dem(tmpdir):
  vrt('test/3dep13.d', f'{tmpdir}/actual.vrt')
  with open(f'{tmpdir}/actual.vrt', 'r') as file:
    actualVrt = file.read()
  with open('test/expected.vrt', 'r') as file:
    expectedVrt = file.read()
  assert actualVrt == expectedVrt
