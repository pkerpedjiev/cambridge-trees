Get the data:

```
wget http://gis.cambridgema.gov/download/shp/ENVIRONMENTAL_StreetTrees.shp.zip
wget http://gis.cambridgema.gov/download/shp/ASSESSING_ParcelMapIndexFY2016.shp.zip

unzip ENVIRONMENTAL_StreetTrees.shp.zip
unzip ASSESSING_ParcelMapIndexFY2016.shp.zip
```

Convert to GeoJSON and WGS84 coordinates [1,2]:

```
ogr2ogr -t_srs WGS84 -f GeoJSON -select species,diameter cambridge-trees.json ENVIRONMENTAL_StreetTrees.shp
ogr2ogr -t_srs WGS84 -f GeoJSON parcel-map.json ASSESSING_ParcelMapIndexFY2016.shp
```

Convert to topojson, excluding various fields:

```
geo2topo cambridge-trees.json > cambridge-trees.topo
```

References:

[1] [Transform Projections with GDAL / OGR](http://gothos.info/2009/04/transform-projections-with-gdal-ogr/)
[2] [Interactive Map with d3.js](http://www.tnoda.com/blog/2013-12-07)
