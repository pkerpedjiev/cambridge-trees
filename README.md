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

### Preparing the data

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

Convert the roads data to TopoJSON to save some space:

```
geo2topo roads.json -q 1000 > roads.topo
```

Count the trees in each block (Combining different types of Maple, Elm, Linden, etc...). 
To avoid that find the line with `split(',')` in `trees_to_blocks.py`.:

```
pypy scripts/trees_to_blocks.py trees.json blocks.json
```

Convert the trees file to `topojson` to save space. Quantizing values reduces the file size from ~8Mb to ~500Kb, at the expense of some barely visible resolution.

```
geo2topo trees.json -q 1000 > trees.topo
```

### Making the Actual Map

#### `index.html`

The `index.html` file is minimal. It simply sets up an SVG canvas and then loads `d3`, `topojson` and our bespoke drawing script (`index.js`). 

```
>><body>

      <link rel="stylesheet" href="css/index.css">
>>    <svg width=400 height=400 style="border: 1px solid">

>>    </svg>

      <script src="https://d3js.org/d3.v4.min.js"></script>
      <script src="//d3js.org/topojson.v1.min.js"></script>
      <script src="js/index.js"></script>

  </body>
```

#### `index.css`

Because this tutorial is meant to focus more on the D3 part of the mapmaking process, I'll just paste the contents of the stylesheet that accompanies it here and go through all the remaining motions assuming it's in place and properly referenced from `index.html`:

```
@import url('https://fonts.googleapis.com/css?family=Francois+One');

.block {
    fill: black;
    opacity: 0.4;
}

.block.selected {
    opacity: 1.0;
    stroke-width: 10;
}

.road {
    stroke: black;
    stroke-width: 1px;
    fill: transparent;
    opacity: 0.6;
}

text {
  font: 10px sans-serif;
}

.legend-rect {
    stroke-width: 0px;
    stroke: black;
    opacity: 0.6;
}

.legend-rect.selected {
    opacity: 1.0;
    stroke-width: 3;
}

text.title {
    font-family: 'Francois One', sans-serif;
    font-size: 15px;
    font-weight: bold;
    opacity: .7;
}

text.abstract {
    font-style: italic;
    opacity: 0.9;
}
```

### `index.js`

Making the map itself requires a few steps. These steps will be enumerated in the order in which I completed them. They don't necessarily need to be done in this order.

#### Drawing the parcels and coloring according to tree types

The first thing we need to do is draw each parcel. This requires creating an SVG group, loading the blocks GeoJSON, and coloring each parcel according to what the most popular tree there is:

```
var width=550, height=400;

var svg = d3.select('svg')
            .attr('width', width)
            .attr('height', height);

// create some elements that will store our map
var g = svg.append('g')
var gBlocks = g.append('g');

var projection = d3.geoMercator()
.scale(1000000)

var path = d3.geoPath()
.projection(projection);

d3.json("block_trees.json", function(error, data) {
    if (error) throw error;

    gBlocks.selectAll('.block')
    .data(data.features)
    .enter()
    .append('path')
    .attr("class", "block")
    .attr('d', path)
    .attr('stroke', 'black')
}
```
We do that, and we should see our image, right?

![image](https://cloud.githubusercontent.com/assets/2143629/20358661/ab10d332-abfa-11e6-9d5d-698308253148.png)

Wrong! What happened? We're going to assume that our stylesheet is properly formatted and included in the html file so that every element of type `block` gets painted with non-white colors. Let's inspect the document to see what's being drawn:

![image](https://cloud.githubusercontent.com/assets/2143629/20358894/a1066a0e-abfb-11e6-96f8-faf302e41fe6.png)

The paths are there. They're just *way* off the visible area. Annoying. A quick google search yields a solution in [one of Mike Bostock's blocks](https://bl.ocks.org/mbostock/4699541):

```
    var bounds = path.bounds(data),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = .9 / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.attr('transform', "translate(" + translate + ")scale(" + scale + ")")
```

![image](https://cloud.githubusercontent.com/assets/2143629/20358581/59f2bdc6-abfa-11e6-8fa2-2cff0c080355.png)


![image](https://cloud.githubusercontent.com/assets/2143629/20358521/0b1b1784-abfa-11e6-8ab3-de4498348801.png)


References:

[1] [Transform Projections with GDAL / OGR](http://gothos.info/2009/04/transform-projections-with-gdal-ogr/)

[2] [Interactive Map with d3.js](http://www.tnoda.com/blog/2013-12-07)
