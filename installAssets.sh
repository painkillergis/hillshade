if [ ! -f 'assets/USGS_NED_13_n38w106_IMG.zip' ]; then
  aws s3 cp s3://prd-tnm/StagedProducts/Elevation/13/IMG/USGS_NED_13_n38w106_IMG.zip assets/
  unzip -d assets/ assets/USGS_NED_13_n38w106_IMG.zip USGS_NED_13_n38w106_IMG.img
fi
if [ ! -f 'assets/n38w107.zip' ]; then
  aws s3 cp s3://prd-tnm/StagedProducts/Elevation/13/IMG/n38w107.zip assets/
  unzip -d assets/ assets/n38w107.zip imgn38w107_13.img
fi
