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

```bash
geo2topo roads.json -q 1000 > roads.topo
```

Count the trees in each block (Combining different types of Maple, Elm, Linden, etc...). 
To avoid that find the line with `split(',')` in `trees_to_blocks.py`.:

```bash
pypy scripts/trees_to_blocks.py trees.json blocks.json
```

Convert the trees file to `topojson` to save space. Quantizing values reduces the file size from ~8Mb to ~500Kb, at the expense of some barely visible resolution.

```bash
geo2topo trees.json -q 1000 > trees.topo
```

### Making the Actual Map

#### `index.html`

The `index.html` file is minimal. It simply sets up an SVG canvas and then loads `d3`, `topojson` and our bespoke drawing script (`index.js`). 

```html
<body>

      <link rel="stylesheet" href="css/index.css">
      <svg width=400 height=400 style="border: 1px solid">

      </svg>

      <script src="https://d3js.org/d3.v4.min.js"></script>
      <script src="//d3js.org/topojson.v1.min.js"></script>
      <script src="js/index.js"></script>

  </body>
```

#### `index.css`

Because this tutorial is meant to focus more on the D3 part of the mapmaking process, I'll just paste the contents of the stylesheet that accompanies it here and go through all the remaining motions assuming it's in place and properly referenced from `index.html`:

```css
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

```javascript
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

```javascript
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

All of the parcels in Cambridge are plotted. They need colors. We can color them according to the most common tree species in that block. That data is in the properties of each `feature` (each feature is a block). We need to extract all of the unique tree names:

    var treeNames = d3.set(data.features.map(function(d) {
        return d.properties.most_common_tree_name}));
        
And use them to create a color scale:

    var colorList = ["rgb(52,71,180)", "rgb(202,211,250)","rgb(86,238,173)", "rgb(32,80,46)", "rgb(135,212,207)", "rgb(38,85,130)", "rgb(142,128,251)", "rgb(194,223,125)", "rgb(119,49,41)", "rgb(244,142,155)", "rgb(186,26,23)", "rgb(44,245,43)", "rgb(31,147,131)", "rgb(53,151,33)", "rgb(162,6,85)", "rgb(253,143,47)", "rgb(157,141,136)", "rgb(241,192,57)", "rgb(132,30,164)", "rgb(226,109,248)", "rgb(63,22,249)", "rgb(50,149,233)", "rgb(254,22,244)", "rgb(249,79,156)", "rgb(239,208,165)"]  // thanks to Colorgorical

    var colorScale = d3.scaleOrdinal()
    .domain(treeNames)
    .range(colorList);
    
The colors that are used here were generated using [Colorgorical](http://vrl.cs.brown.edu/color). Now when we draw each block, we simply need to change its `fill` according to its most common tree species:

```javascript
    gBlocks.selectAll('.block')
    .data(data.features)
    .enter()
    .append('path')
    .attr("class", "block")
    .attr('d', path)
    .attr('stroke', 'black')
    .style('fill', function(d) { return colorScale(d.properties.most_common_tree_name) })
```


![image](https://cloud.githubusercontent.com/assets/2143629/20358521/0b1b1784-abfa-11e6-8ab3-de4498348801.png)

#### Adding a legend

Colors are nice, but without a legend it's impossible to tell what they mean. I'd like the legend to be ordered according to the prevalence of the tree species. For this we can count in how many blocks each species is the most common and use that to sort our list of tree names. Now the most common (Maple) is first and others are ordered behind it.

```javascript
    var popularTreeCounts = {}
    for (let i = 0; i < data.features.length; i++) {
        var treeName = data.features[i].properties.most_common_tree_name
        if (treeName in popularTreeCounts)
            popularTreeCounts[treeName] += 1;
        else
            popularTreeCounts[treeName] = 1;
            
    // a list of the tree types, sorted by how common they are
    var treeList = treeNames.values().sort(function(a,b) { return popularTreeCounts[b] - popularTreeCounts[a]} );
```

With 25 species in our list, we'll need two columns to display them all:

```javascript
    var halfTreeListLength = Math.ceil(treeList.length / 2);
    var legendItems = gLegend.selectAll('.legend-item')
    .data(treeList)
    .enter()
    .append('g')
    .classed('legend-item', true)
    .attr('transform', function(d,i) {
        return "translate(" + (legendColumnWidth * Math.floor(i / halfTreeListLength)) + ',' + ((i % halfTreeListLength) * legendRowHeight) + ")";
    })

    legendItems.append('text')
        .text(function(d) { return d + " (" + popularTreeCounts[d] + ")"; })
        .attr('dy', 8)
        .attr('dx', 4);
```

![image](https://cloud.githubusercontent.com/assets/2143629/20360817/2b741162-ac03-11e6-87df-4e07a1ac34bc.png)

And... we'll need to match them up with how they're colored in the map. 

```javascript
    var itemBarWidth = 20;
    var itemBarLength = 6

    legendItems.append('rect')
        .attr('x', -itemBarLength)
        .attr('y', 2)
        .attr('height', legendRowHeight - 4)
        .attr('width', itemBarLength)
        .classed('legend-rect', true)
        .style('fill', function(d) { return colorScale(d) }) ;
```

![image](https://cloud.githubusercontent.com/assets/2143629/20361021/0d50dc1e-ac04-11e6-8238-3be778254110.png)

#### Adding interaction

What we have so far is great for seeing that Maples and Honeylocusts are the most common trees in the majority of Cambridge blocks. Matching the less popular ones, however, remains a difficult exercise. Having this many different colors makes it difficult to distinguish between them. For that, we need interaction.

Using D3's event handlers, we can highlight the regions that viewers hover over in both the map and the legend to unambiguously show which species is most common where. To this, we'll define two helper functions: `selectTreeType` and `unselectAllTreeTypes`. These functions will highlight regions associated with a particular species (on both the map and legend), and unhighlight all regions, respectively:

```javascript
    function selectTreeType(treeType) {
        var allBlocks = gBlocks.selectAll('.block')
        var sameBlocks = allBlocks.filter(function(e) {
            return e.properties.most_common_tree_name == treeType;
        });

        sameBlocks.classed('selected', true);

        gLegend.selectAll('.legend-rect')
            .filter(function(d) { return d == treeType; })
            .classed('selected', true);
    }

    function unselectAllTreeTypes() {
        gBlocks.selectAll('.block')
            .classed('selected', false);

        gLegend.selectAll('.legend-rect')
            .classed('selected', false);
    }
```

With these functions in place, we'll add event handlers to the species associated regions (e.g. map blocks and legend items) such that whenever hovers over a region everything is unhighlighted (to remove previous highlights) and the selected region is highlighted.

```javascript
    legendItems.on('mouseover', function(d) {
        d3.selectAll('.legend-rect').classed('selected', false);
        d3.select(this).select('rect').classed('selected', true)
        gBlocks.selectAll('.block').classed('selected', false);
        selectTreeType(d);
    });

    gBlocks.selectAll('.block')
    .data(data.features)
    .enter()
    .append('path')
    .attr("class", "block")
    .attr('d', path)
    .attr('stroke', 'black')
    .style('fill', function(d) { return colorScale(d.properties.most_common_tree_name) })
    .on('mouseover', function(d) {
        unselectAllTreeTypes();
        selectTreeType(d.properties.most_common_tree_name);
    });
```

Now we can see regions where, e.g. Oak is most common:

![image](https://cloud.githubusercontent.com/assets/2143629/20361452/9cc713c6-ac05-11e6-9b7c-b17ee8289acf.png)

or... the one block where Hornbeam is the most common:

![image](https://cloud.githubusercontent.com/assets/2143629/20363524/814ed54a-ac0d-11e6-9444-974c8e1a4369.png)

If the mouse leaves one of the species-associated regions, we want to unhighlight everything:

```javascript
    bgRect.on('mouseover', unselectAllTreeTypes);
```

Before we finish off the data-driven section, let's add some roads so that we know where everything is. This is easy to do with our previously generated topojson file. 

```javascript
d3.json("roads.topo", function(error, data1) {
    gRoads.selectAll('.road')
    .data(topojson.feature(data1,data1.objects.roads).features)
    .enter()
    .append('path')
    .attr("class", "road")
    .attr('d', path)
});
```

![image](https://cloud.githubusercontent.com/assets/2143629/20364038/afe54144-ac0f-11e6-84c8-b34dd083245c.png)

#### Decoration and description

No map or graphic is complete without a title and some explanation. We need a group below all the others, as well as some text for the tile and description. Note that getting wrapped text is difficult using SVG, so we'll just position each line separately.

```javascript
var gBackground = d3.select('svg')
          .append('g')
          
svg.append('text')
.classed('title', true)
.text("Common Trees in Cambridge")
.attr('x', 430)
.attr('y', 40)
.attr('text-anchor', 'middle')
;

texts = ['This map shows which trees are found',
         'most often on each block in Cambridge',
         'Use the mouse to hover over items',
         'in the legend or on the map to see',
         'where each species is most common']

var gAbstract = svg.append('g')
.attr('transform', 'translate(20,340)')

gAbstract.selectAll('.abstract')
.data(texts)
.enter()
.append('text')
.classed('abstract',true)
.attr('y', function(d,i) { return 10 * i; })
.text(function(d) { return d; });
```

That's it! A fully functional, interactive, data-driven map built using D3.js. Yay!
    
References:

[1] [Transform Projections with GDAL / OGR](http://gothos.info/2009/04/transform-projections-with-gdal-ogr/)

[2] [Interactive Map with d3.js](http://www.tnoda.com/blog/2013-12-07)
