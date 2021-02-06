tileWidth=$1
width=$2
height=$3
scale=$4
samples=$5

sourcePath=$6
destinationPath=$7

heightmapTilesDir=$8
hillshadeTilesDir=$9

if [ "$#" -ne 9 ] ; then
 echo ./blender-wrapper.zsh tileWidth width height scale samples sourcePath desitinationPath heightmapTilesDir hillshadeTilesDir
 exit 1
fi

mkdir -p $heightmapTilesDir $hillshadeTilesDir

python ~/ws/painkillergis/blender/hillshade.py \
  $sourcePath \
  $heightmapTilesDir \
  $hillshadeTilesDir \
  $tileWidth \
  $tileWidth \
  $tileWidth \
  $scale \
  $samples

python ~/ws/painkillergis/blender/stitch.py \
  $hillshadeTilesDir \
  $destinationPath

python ~/ws/painkillergis/blender/copyGeotransform.py \
  $sourcePath \
  $destinationPath
