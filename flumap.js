var width = 480,
  height = 1160;

var scottishPostcodes = [
  'AB',
  'DD',
  'DG',
  'EH',
  'FK',
  'G',
  'HS',
  'IV',
  'KA',
  'KW',
  'KY',
  'ML',
  'PA',
  'PH',
  'TD',
  'ZE'
];

var formatPercent = d3.format(".0%");
var formatNumber = d3.format(".0f");

var projection = d3.geoAlbers()
  .center([0, 55.4])
  .rotate([4.4, 0])
  .parallels([50, 60])
  .scale(1200 * 5)
  .translate([width / 2, height / 2]);

var path = d3.geoPath()
  .projection(projection);

var fillColor = d3.scaleThreshold()
  .domain([0.01, 0.02, 0.05, 0.1, 0.25])
  .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

var x = d3.scaleLinear()
  .domain([0, 1])
  .range([0, 240]);

var xAxis = d3.axisBottom(x)
  .tickSize(13)
  .tickValues(fillColor.domain())
  .tickFormat(function(d) {
    return d === 0.5 ? formatPercent(d) : formatNumber(100 * d);
  });

function centre(d) {
  return "translate(" + path.centroid(d) + ")";
}

d3.queue()
  .defer(d3.json, "postcode-hi.json")
  .defer(d3.tsv, "mock-data.tsv")
  .await(transform)

function transform(err, uk, data) {
  var countsByPostcode = _.chain(data)
    .countBy(function(e) {
      return e.postcode.match(/^([A-Z]+)/)[1];
    })
    .mapValues(function(e) {
      return e / data.length;
    })
    .value();

  var areas = uk.objects['uk-postcode-area'].geometries.filter(function(a) {
    var code = a.properties.NAME.match(/^([A-Z]+)/)[1];
    return scottishPostcodes.includes(code);
  });

  uk.objects['sco-postcode-area'] = {
    type: 'GeometryCollection',
    geometries: areas
  };

  draw(uk, countsByPostcode);
}

function draw(uk, counts) {
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.selectAll(".subunit")
    .data(topojson.feature(uk, uk.objects['sco-postcode-area']).features)
    .enter()
    .append("path")
      .attr("class", "postcode_area")
      .attr("d", path)
      .style("fill", function(d) {
        return fillColor(counts[d.id]);
      })
      .append("svg:title")
        .attr("transform", centre)
        .attr("dy", ".35em")
        .text(function(d) { return d.id; });

  svg.append("path")
    .datum(topojson.mesh(uk, uk.objects['sco-postcode-area'], function(a, b) {
      return a !== b;
    }))
    .attr("class", "mesh")
    .attr("d", path);

  var labelData = fillColor.range().map(function(c) {
      var d = fillColor.invertExtent(c);
      if (d[0] == null) { d[0] = x.domain()[0]; }
      if (d[1] == null) { d[1] = x.domain()[1]; }
      return d;
    });

  var axisGroup = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0, 700)");

  axisGroup.append("text")
    .attr("class", "title")
    .attr("fill", "#000")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("y", "1em")
    .text("Percentage of volunteers from each postcode area")

  var keyGroup = axisGroup.append("g")
    .attr("transform", "translate(0, 20)");

  keyGroup.selectAll("rect")
    .data(labelData)
    .enter()
      .insert("rect")
        .attr("class", "tick")
        .attr("height", 8)
        .attr("x", function(d, i) {
          return i * 75;
        })
        .attr("width", 75)
        .attr("fill", function(d) {
          return fillColor(d[0]);
        });

    keyGroup.selectAll("text.ticklabel")
      .data(labelData)
      .enter().append("text")
        .attr("class", "ticklabel")
        .attr("x", "0.35em")
        .attr("y", "1.5em")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dx", function(d, i) {
          return (i * 75) + 33;
        })
        .text(function(d) {
          return d[0] + " - " + d[1];
        });
}
