### Running the map

```
python -m SimpleHTTPServer
```

And point your browser to [http://127.0.0.1:8000](http://127.0.0.1:8000)


### Prerequisites

Install some software:

```
brew install gdal
npm install topojson -g

pip install shapely
```

### Getting the data

Get the data:

```
wget http://gis.cambridgema.gov/download/shp/ENVIRONMENTAL_StreetTrees.shp.zip
wget http://gis.cambridgema.gov/download/shp/ASSESSING_ParcelMapIndexFY2016.shp.zip
wget http://gis.cambridgema.gov/download/shp/BASEMAP_Roads.shp.zip

unzip ENVIRONMENTAL_StreetTrees.shp.zip
unzip ASSESSING_ParcelMapIndexFY2016.shp.zip
unzip BASEMAP_Roads.shp.zip
```

Convert to GeoJSON and WGS84 coordinates [1,2]:

```
ogr2ogr -t_srs WGS84 -f GeoJSON -select species,diameter trees.json ENVIRONMENTAL_StreetTrees.shp
ogr2ogr -t_srs WGS84 -f GeoJSON blocks.json ASSESSING_ParcelMapIndexFY2016.shp
ogr2ogr -t_srs WGS84 -f GeoJSON roads.json BASEMAP_Roads.shp
```

Count the trees in each block (Combining different types of Maple, Elm, Linden, etc...). 
To avoid that find the line with `split(',')` in `trees_to_blocks.py`.:

```
pypy scripts/trees_to_blocks.py trees.json blocks.json
```

Convert to topojson, excluding various fields:

```
geo2topo trees.json > trees.topo
```

References:

[1] [Transform Projections with GDAL / OGR](http://gothos.info/2009/04/transform-projections-with-gdal-ogr/)

[2] [Interactive Map with d3.js](http://www.tnoda.com/blog/2013-12-07)
