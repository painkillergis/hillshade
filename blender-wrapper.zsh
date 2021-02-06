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

python ~/ws/painkillergis/blender/heightmapToTiles.py \
  $sourcePath \
  $heightmapTilesDir \
  $tileWidth \
  $tileWidth

ls $heightmapTilesDir | \
  while read f ; do \
    if [[ "`ls $hillshadeTilesDir`" == *$f* ]] ; then echo skipping $f ; continue ; fi
    id=`echo $f | cut -d '.' -f1`
    blender -b \
      -P ~/ws/painkillergis/blender/blender.py \
      -noaudio \
      -o //$hillshadeTilesDir/#-$id.tif \
      -f 0 \
      -- \
      $heightmapTilesDir/$f \
      $((tileWidth*3)) \
      $((tileWidth*3)) \
      --scale $scale \
      --samples $samples \
      --chunks=true
  done

montage \
  -mode Concatenate \
  -geometry ${tileWidth}x${tileWidth} \
  $hillshadeTilesDir/* \
  miff:- | \
  magick - \
    -crop ${width}x${height} \
    $destinationPath

python ~/ws/painkillergis/blender/copyGeotransform.py \
  $sourcePath \
  $destinationPath
