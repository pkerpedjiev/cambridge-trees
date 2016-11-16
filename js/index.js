var width=400, height=400;

var g = d3.select('svg')
          .append('g')

var projection = d3.geoMercator()
.scale(1000000)
.translate([-1240829, 817805])

var path = d3.geoPath()
.projection(projection);


d3.json("block_trees.json", function(error, data) {
    if (error) throw error;

    console.log('data:', data.features);
    var treeNames = d3.set(data.features.map(function(d) {
        return d.properties.most_common_tree_name}));


    var treeDensities = data.features.map(function(d) {
            return d.properties.total_tree_count / d.properties.area;
        })
    console.log('treeDensities', treeDensities);
    var opacityExtent = d3.extent(treeDensities)
    console.log('opacityExtent', opacityExtent)
    // scale the opacity according to tree density
    var opacityScale = d3.scaleLinear()
        .domain(opacityExtent)
        .range([0,1]);

    var colorScale = d3.scaleOrdinal()
    .domain(treeNames)
    .range(d3.schemeCategory20b.concat(d3.schemeCategory20c));

    g.selectAll('path')
    .data(data.features)
    .enter()
    .append('path')
    .attr("class", "block")
    .attr('d', path)
    .style('fill', function(d) { return colorScale(d.properties.most_common_tree_name) })
    .style('opacity', function(d) { return opacityScale(d.properties.total_tree_count / d.properties.area); });

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
    d3.json("block_trees.json", function(error, data) {

    });
});

                           




           




           



