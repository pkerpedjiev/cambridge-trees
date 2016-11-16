var width=400, height=400;

var bgRect = d3.select('svg').append('rect')
              .attr('width', width)
              .attr('height', height)
              .attr('fill', 'white');

var g = d3.select('svg')
          .append('g')



var projection = d3.geoMercator()
.scale(1000000)
.translate([-1240829, 817805])

var path = d3.geoPath()
.projection(projection);


d3.json("block_trees.json", function(error, data) {
    if (error) throw error;

    var treeNames = d3.set(data.features.map(function(d) {
        return d.properties.most_common_tree_name}));


    var treeDensities = data.features.map(function(d) {
            return d.properties.total_tree_count / d.properties.area;
        })
    var opacityExtent = d3.extent(treeDensities)
    // scale the opacity according to tree density
    var opacityScale = d3.scaleLinear()
        .domain(opacityExtent)
        .range([0,1]);

    var colorScale = d3.scaleOrdinal()
    .domain(treeNames)
    .range(d3.schemeCategory20b.concat(d3.schemeCategory20c));

    var gBlocks = g.append('g');

    function selectSameBlocks(d) {
        // select all blocks with the same most common tree
        var allBlocks = gBlocks.selectAll('.block')
        var sameBlocks = allBlocks.filter(function(e) {
            return e.properties.most_common_tree_name == d.properties.most_common_tree_name;
        });

        return sameBlocks;
    }

    bgRect.on('mouseover', function(d) {
        gBlocks.selectAll('.block').style('opacity', 0.4);
        gBlocks.selectAll('.block').attr('stroke-width', 0);
    });

    gBlocks.selectAll('.block')
    .data(data.features)
    .enter()
    .append('path')
    .attr("class", "block")
    .attr('d', path)
    .attr('stroke', 'black')
    .style('fill', function(d) { return colorScale(d.properties.most_common_tree_name) })
    .style('opacity', 0.4)
    .on('mouseover', function(d) {
        gBlocks.selectAll('.block').style('opacity', 0.4);
        gBlocks.selectAll('.block').attr('stroke-width', 0);
        selectSameBlocks(d).style('opacity', 1.0)
        selectSameBlocks(d).attr('stroke-width', 10);
    })
    ;
    //.style('opacity', function(d) { return opacityScale(d.properties.total_tree_count / d.properties.area); });

    /* scale to fit all of cambridge */
    // https://bl.ocks.org/mbostock/4699541
    var bounds = path.bounds(data),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = .9 / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.attr('transform', "translate(" + translate + ")scale(" + scale + ")")
    d3.json("roads.topo", function(error, data1) {
        console.log('data1:', data1);
        
        var gRoads = g.append('g')

        gRoads.selectAll('.road')
        .data(topojson.feature(data1,data1.objects.roads).features)
        .enter()
        .append('path')
        .attr("class", "road")
        .attr('d', path)
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'transparent')
        .style('opacity', 0.6)
    });
});

                           




           




           



