var width = 480,
  height = 600;

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
  .rotate([4.4, -2])
  .parallels([50, 60])
  .scale(1200 * 4)
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
  .defer(d3.json, "scotland-postcode.json")
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

  draw(uk, countsByPostcode);
}

function draw(uk, counts) {
  var zoom = d3.zoom()
    .scaleExtent([1, 8])
    //.translateExtent([0, 0], [width, height])
    .on("zoom", zoomed);

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid blue");

  svg.call(zoom);

  var g = svg.append('g');

  g.selectAll(".subunit")
    .data(topojson.feature(uk, uk.objects['uk-postcodes-xx-area']).features)
    .enter()
    .append("path")
      .attr("class", "postcode_area")
      .attr("d", path)
      .style("fill", function(d) {
        return fillColor(counts[d.properties.NAME]);
      })
      .on("mouseover", function() {
        d3.select(this)
          .classed("highlight", true)
          .style("fill", function(d) {
            return d3.rgb(fillColor(counts[d.properties.NAME])).brighter(0.25);
          });
      })
      .on("mouseout", function() {
        d3.select(this)
          .classed("highlight", false)
          .style("fill", function(d) {
            return fillColor(counts[d.properties.NAME]);
          });
      })
      .append("svg:title")
        .attr("transform", centre)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.properties.NAME + " " + (counts[d.properties.NAME] * 100).toFixed(1) + "%";
        });

  var lowMesh = g.append("path")
    .datum(topojson.mesh(uk, uk.objects['uk-postcodes-xx-area'], function(a, b) {
      return a !== b;
    }))
    .attr("class", "mesh lo")
    .attr("d", path);

  var highMesh = g.append("path")
    .datum(topojson.mesh(uk, uk.objects['uk-postcodes-xxnn-area'], function(a, b) {
      return a !== b;
    }))
    .attr("class", "mesh hi")
    .style("visibility", "hidden")
    .attr("d", path);

  var labelData = fillColor.range().map(function(c) {
      var d = fillColor.invertExtent(c);
      if (d[0] == null) { d[0] = x.domain()[0]; }
      if (d[1] == null) { d[1] = x.domain()[1]; }
      return d;
    });

  var axisGroup = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0, 550)");

  var axisBackground = axisGroup.append("rect")
    .attr("class", "axis-bg")
    .attr("width", 480)
    .attr("height", 50);

  var labelsGroup = axisGroup.append('g')
    .attr("transform", "translate(15)");

  labelsGroup.append("text")
    .attr("class", "title")
    .attr("fill", "#000")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("y", "1em")
    .text("Percentage of volunteers from each postcode area")

  var keyGroup = labelsGroup.append("g")
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

  function zoomed() {
    var t = d3.event.transform;

    t.x = d3.min([t.x, 0]);
    t.y = d3.min([t.y, 0]);
    t.x = d3.max([t.x, (1-t.k) * width]);
    t.y = d3.max([t.y, (1-t.k) * height]);

    g.attr("transform", t);

    if (t.k >= 3.5) {
      highMesh.style("visibility", null);
      lowMesh.style("visibility", "hidden");
    } else {
      highMesh.style("visibility", "hidden");
      lowMesh.style("visibility", null);
    }

    highMesh.style("stroke-width", 0.5 / d3.event.transform.k + "px");
    lowMesh.style("stroke-width", 0.5 / d3.event.transform.k + "px");
  }
}
