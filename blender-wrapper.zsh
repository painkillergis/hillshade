tileWidth=$1
widthInches=$2
heightInches=$3
scale=$4
samples=$5

sourcePath=$6
destinationPath=$7

heightmapChunksDir=$8
hillshadeChunksDir=$9

if [ "$#" -ne 9 ] ; then
 echo ./blender-wrapper.zsh tileWidth widthInches heightInches scale samples sourcePath desitinationPath heightmapChunksDir hillshadeChunksDir
 exit 1
fi

mkdir -p $heightmapChunksDir $hillshadeChunksDir

python ~/ws/painkiller-blender/heightmapToChunks.py \
  $sourcePath \
  $heightmapChunksDir \
  $tileWidth \
  $tileWidth

ls $heightmapChunksDir | \
  while read f ; do \
    id=`echo $f | cut -d '.' -f1`
    blender -b \
      -P ~/ws/painkiller-blender/blender.py \
      -noaudio \
      -o //$hillshadeChunksDir/#-$id.tif \
      -f 0 \
      -- \
      $heightmapChunksDir/$f \
      $((tileWidth*3)) \
      $((tileWidth*3)) \
      --scale $scale \
      --samples $samples \
      --chunks=true
  done

montage \
  -mode Concatenate \
  -geometry ${tileWidth}x${tileWidth} \
  $hillshadeChunksDir/* \
  miff:- | \
  magick - \
    -crop ${widthInches}x${heightInches} \
    $destinationPath

python ~/ws/painkiller-blender/copyGeotransform.py \
  $sourcePath \
  $destinationPath
