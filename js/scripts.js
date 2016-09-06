/*
// central idea modified from http://neuralengr.com/asifr/journals/
*/

var margin = {top: 80, right: 0, bottom: 0, left: 20},
  width = 600, // width of neighbourhood + crime types + comm_housing bars
  height = 550;

var maxBarWidth = 200, // community housing bar chart data
  barHeight = 15
  xAxisWidth = 280;

var c10 = d3.scale.category10();

var x = d3.scale.ordinal()
  .domain(["Arsons","Assaults", "Break & Enters", "Fire Alarms", "Medical Calls",
          "Vehicle Incidents", "Hazardous Incidents", "Murders", "Robberies",
          "Sexual Assaults", "Thefts", "Vehicle Thefts"])
  .rangePoints([0, xAxisWidth]);

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("top");

var xBarScale = d3.scale.linear()
  .domain([0, 1])
  .range([0, 10]);

var formatDecimal = d3.format(".2f")

var mapWidth = 400,
    mapHeight = 400;

var projection = d3.geo.albers();

var path = d3.geo.path()
  .projection(projection);

var svg = d3.select("#svg-wrapper").append("svg")
  .attr("width", width + margin.left + margin.right + mapWidth)
  .attr("height", height);

var chartGroup = svg.append("g") // D3 group element
  .attr("class", "chartGroup")
  .attr("transform", "translate(" + 50 + "," + margin.top + ")");

var mapGroup = svg.append("g")
  .attr("class", "mapGroup")
  .attr("width", mapWidth)
  .attr("height", mapHeight)
  .attr("transform", "translate(" + 600 + "," + 40 + ")");

var mapLabel = mapGroup.append("text")
  .attr("y", 180)
  .attr("x", -85)
  .attr("class", "map_neighbourhood_name")
  .attr("transform", "rotate(-27)")
  .text("Toronto Neighbourhoods")

chartGroup.append("text")
  .attr("class", "housing_info")
  .attr("transform", "translate(" + 470 + "," + 0 + ")")
  .text("Housing Population Ratio")

chartGroup.append("text")
  .attr("class", "neighbourhood_info")
  .attr("transform", "translate(" + 50 + "," + 0 + ")")
  .text("Toronto Neighbourhoods")

// axis group
chartGroup.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + 170 + "," + 0 + ")")
    .call(xAxis)
  .selectAll("text")
    .attr("y", -10)
    .attr("x", 5)
    .attr("dy", ".35em")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "start");


var neighbourhoodDataset
var workingDataset
var lookupTable = {}
var workingTable = {}


d3.json("data/neighbourhoods.json", function(error, data) {
  if (error) throw error;

  neighbourhoodDataset = data
  updateLookup(neighbourhoodDataset, lookupTable);

  // Initialize chart with top 20 community housing pop_ratio
  neighbourhoodDataset.sort(function(a, b) {
      return b.comm_housing_pop_ratio - a.comm_housing_pop_ratio;
  })

  workingDataset = neighbourhoodDataset.slice(0, 20);

  // Keep track of ids in lookup table
  updateLookup(workingDataset, workingTable)
  update(workingDataset);

});


function updateLookup(data, table) {
  for ( i = 0; i < data.length; i ++) {
      table[data[i].id] = data[i]
  }
}


function update(newData) {

  var rScale = d3.scale.sqrt()
    .domain([1, 800 ])
    .range([1, 10]);

  // Load neightbourhood data
  var neighbourhoods = chartGroup.selectAll(".neighbourhood")
    .data(newData, function(d){ return d["id"] });

  // Put neighbourhood in it's own group element
  var neighbourhoodsEnter = neighbourhoods.enter()
    .append("g")
    .attr("class","neighbourhood")
    .attr("transform", function(d, i) { return "translate(" + 0 + "," + i*2.5 + ")" })
    .attr("height", 30);


  neighbourhoodsEnter
    .append("text")
    .attr("y", function(d,i){ return i*20+25; })
    .attr("x", 140)
    .attr("class", "label")
    .text(function(d,i) { return d["name"]; })
    .style("text-anchor", "end")
    .on("mouseover", mouseoverChart)
    .on("mouseout", mouseoutChart);


  var circles = neighbourhoodsEnter.append("g")
    .attr("class", "circles")
    .attr("transform", function(d, i) { return "translate(" + 0 + "," + (i*20+20) + ")" })

  // Add crime data to each neighbourhoood (circles for size)
  circles.selectAll("circle")
      .data(function(d){ return d["crime_types"] })
    .enter()
      .append("circle")
      .attr("cx", function(d, i) { return i*25+175; })
      .attr("class", "crimes")
      .style("fill", function(d,i) { return c10(i); })
      .transition()
      .delay( function(d,i) { return 100 * i })
      .attr("r", function(d) { return rScale(d3.values(d)[0]); });

  // Add crime data to each neighbourhoood (text for values)
  circles.selectAll("text")
      .data(function(d){ return d["crime_types"]})
    .enter()
      .append("text")
      .attr("class", "rate")
      .attr("x",function(d, i) { return i*25+175; })
      .attr("y", 3)
      .text(function(d){ return d3.values(d)[0]; }) // each d = {key:value} of crime_types
      .style("fill", function(d,i) { return c10(i); })
      .style("text-anchor", "middle")
      .style("display", "none");

  // Add community housing data
  neighbourhoodsEnter
    .append("rect")
    .attr("class", "housing")
    .attr("height", barHeight)
    .attr("y", function(d, i) { return i*20+25/2; }) // center rect on each neighbourhood
    .attr("transform", "translate(" + 470 + "," + 0 + ")")
    .style("fill", c10(0))
    .attr("width", function(d) { return xBarScale(d["comm_housing_pop_ratio"])*100; })


  neighbourhoodsEnter
    .append("text")
    .attr("x", function(d) { return xBarScale(d["comm_housing_pop_ratio"])*100; })
    .attr("y", function(d, i) { return i*20+25/2; })
    .attr("dy", "1.2em") //vertical align middle
    .attr("transform", "translate(" + 480 + "," + 0 + ")")
    .text( function(d) { return formatDecimal(d["comm_housing_pop_ratio"]*100) + "%" } );


  neighbourhoods.exit().remove();

}


// load neighbourhood map data
d3.json("data/toronto_topo.json", function(error, toronto) {
  if (error) throw error;

  var neighbourhoods = topojson.feature(toronto, toronto.objects.toronto);

  // set default projection values
  projection
      .scale(1)
      .translate([0, 0]);

  // creates bounding box and helps with projection and scaling
  var b = path.bounds(neighbourhoods),
    s = .95 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight),
    t = [(mapWidth - s * (b[1][0] + b[0][0])) / 2, (mapHeight - s * (b[1][1] + b[0][1])) / 2];

  // set project with bounding box data
  projection
    .scale(s)
    .translate(t);

  // get individual neighbourhoods
  mapGroup.selectAll("path")
      .data(neighbourhoods.features)
    .enter().append("path")
      .attr("class", "map_neighbourhood")
      .attr("id", function(d) { return d.properties.id; })
      .attr("d", path)
      .on("mouseover", mouseoverMap)
      .on("mouseout", mouseoutMap)

  mapGroup.append("path")
      .datum(topojson.mesh(toronto, toronto.objects.toronto, function(a, b) { return a !== b; }))
      .attr("class", "map_mesh")
      .attr("d", path);

});


// Mouse events
function mouseoverChart(p) {
  // find element, update chart and map
  var g = d3.select(this).node().parentNode;
  id = d3.select(this.parentNode).datum()["id"];

  var neighbourhood = document.getElementById(id);
  neighbourhood.style.fill = "#636363";

  d3.select(g).selectAll("circle").style("display","none");
  d3.select(g).selectAll(".rate").style("display","block");
}

function mouseoutChart(p) {
  // find element, update chart and map
  var g = d3.select(this).node().parentNode;

  id = d3.select(this.parentNode).datum()["id"];

  var neighbourhood = document.getElementById(id);
  neighbourhood.style.fill = "#1f77b4";

  d3.select(g).selectAll("circle").style("display","block");
  d3.select(g).selectAll(".rate").style("display","none");
}

function mouseoverMap(d) {
  mapLabel.text(d.properties.name.slice(0,-5)) // remove suffix id from name
}

function mouseoutMap(d) {
  mapLabel.text("Toronto Neighbourhoods")
}
