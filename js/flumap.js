function flumap() {
  var width = 500;
  var height = 600;
  var keyElementWidth = 75;
  var active = d3.select(null);
  var zoomThreshold = 3.5;

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

  function hoverLabel(counts, d) {
    var c = counts(d.properties.NAME);
    var share = c == null ? 0 : c.share;

    return d.properties.NAME + " " + (share * 100).toFixed(1) + "%";
  }

  function fillColorOnHover(counts, d) {
    var c = counts(d.properties.NAME);
    return c == null
      ? fillColor(0)
      : d3.rgb(fillColor(c.share)).brighter(0.25);
  }

  function baseFill(counts, d) {
    var c = counts(d.properties.NAME);
    return c == null ? fillColor(0) : fillColor(c.share);
  }

  function draw(selection) {
    selection.each(function(d, i) {
      var uk = d.map;
      var counts = d.data;
      var features = topojson.feature(uk, uk.objects['uk-postcodes-xxnn-area']).features;
      var centroids = _.chain(features)
        .keyBy('properties.NAME')
        .mapValues(function(f) { return path.centroid(f); })
        .value();

      var svg = d3.select(this)
        .html("")
        .append("svg")
          .attr("width", width)
          .attr("height", height);

      var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

      var tooltipDiv = d3.select(".map").append("div")
        .classed("tooltip", true)
        .style("opacity", 0);

      var map = svg.append('g');
      var lowLevelView = map.append('g').classed("lowlevel", true);
      var highLevelView = map.append('g').classed("highlevel", true);

      lowLevelView.selectAll(".postcode_area")
        .data(features)
        .enter()
        .append("path")
          .attr("class", "postcode_area")
          .attr("d", path)
          .style("fill", _.partial(baseFill, _.propertyOf(counts.low)))
          .on("mouseover.tooltip", function(d) {
            tooltipDiv.transition()
              .duration(200)
              .style("opacity", 0.9);

            tooltipDiv.html(hoverLabel(_.propertyOf(counts.low), d))
              .style("left", d3.event.pageX + "px")
              .style("top", (d3.event.pageY - 14) + "px");
          })
          .on("mouseout.tooltip", hideTooltip)
          .on("mousemove.tooltip", moveTooltip)
          .on("mouseover", function() {
            d3.select(this)
              .classed("highlight", true)
              .style("fill", _.partial(fillColorOnHover, _.propertyOf(counts.low)));
          })
          .on("mouseout", function() {
            d3.select(this)
              .classed("highlight", false)
              .style("fill", _.partial(baseFill, _.propertyOf(counts.low)))
          })
          .on("click", function() {
            var node = d3.select(this);

            if (node.classed('inactive')) {
              highLevelView.selectAll('.postcode_area')
                .filter(function(d) {
                  return node.datum().properties.NAME.startsWith(d.properties.NAME);
                })
                .each(clicked);
            } else {
              reset();
            }
          });

      var lowMesh = map.append("path")
        .datum(topojson.mesh(uk, uk.objects['uk-postcodes-xxnn-area'], function(a, b) {
          return a !== b;
        }))
        .attr("class", "mesh lo")
        .style("visibility", "hidden")
        .attr("d", path);

      highLevelView.selectAll(".postcode_area")
        .data(topojson.feature(uk, uk.objects['uk-postcodes-xx-area']).features)
        .enter()
        .append("path")
          .attr("class", "postcode_area")
          .attr("d", path)
          .style("fill", _.partial(baseFill, _.propertyOf(counts.high)))
          .on("mouseover.tooltip", function(d) {
            tooltipDiv.transition()
              .duration(200)
              .style("opacity", 0.9);

            tooltipDiv.html(hoverLabel(_.propertyOf(counts.high), d))
              .style("left", d3.event.pageX + "px")
              .style("top", (d3.event.pageY - 14) + "px");
          })
          .on("mouseout.tooltip", hideTooltip)
          .on("mousemove.tooltip", moveTooltip)
          .on("mouseover.highlight", function(d) {
            d3.select(this)
              .classed("highlight", true)
              .style("fill", _.partial(fillColorOnHover, _.propertyOf(counts.high)));
          })
          .on("mouseout.highlight", function() {
            d3.select(this)
              .classed("highlight", false)
              .style("fill", _.partial(baseFill, _.propertyOf(counts.high)));
          })
          .on("click", clicked);

      var highMesh = map.append("path")
        .datum(topojson.mesh(uk, uk.objects['uk-postcodes-xx-area'], function(a, b) {
          return a !== b;
        }))
        .attr("class", "mesh hi")
        .attr("d", path);

      var labelData = fillColor.range().map(function(c) {
          var d = fillColor.invertExtent(c);
          if (d[0] == null) { d[0] = x.domain()[0]; }
          if (d[1] == null) { d[1] = x.domain()[1]; }
          return d;
        });

      var axisGroup = svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0, " + (height - 50) + ")");

      var axisBackground = axisGroup.append("rect")
        .attr("class", "axis-bg")
        .attr("width", width)
        .attr("height", 50);

      var labelsGroup = axisGroup.append('g')
        .attr("transform", "translate(" + (width - (fillColor.range().length * keyElementWidth)) / 2 + ")");

      labelsGroup.append("text")
        .attr("class", "title")
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
              return i * keyElementWidth;
            })
            .attr("width", keyElementWidth)
            .attr("fill", function(d) {
              return fillColor(d[0]);
            });

      keyGroup.selectAll("text.ticklabel")
        .data(labelData)
        .enter().append("text")
          .attr("class", "ticklabel")
          .attr("x", "0.35em")
          .attr("y", "1.5em")
          .attr("dx", function(d, i) { return (i * keyElementWidth) + 33; })
          .text(function(d) { return d[0] + " - " + d[1]; });

      svg.call(zoom);

      function moveTooltip() {
        tooltipDiv
          .style("left", d3.event.pageX + "px")
          .style("top", (d3.event.pageY - 14) + "px");
      }

      function hideTooltip() {
        tooltipDiv.transition()
          .duration(500)
          .style("opacity", 0);
      }

      function zoomed() {
        var t = d3.event.transform;

        t.x = d3.min([t.x, 0]);
        t.y = d3.min([t.y, 0]);
        t.x = d3.max([t.x, (1-t.k) * width]);
        t.y = d3.max([t.y, (1-t.k) * height]);

        map.attr("transform", t);

        if (!active.empty() || t.k >= zoomThreshold) {
          lowMesh.style("visibility", null);

          highLevelView
            .style("display", "none");

        } else {
          highLevelView
            .style("display", "inline");

          lowMesh.style("visibility", "hidden");
        }

        highMesh.style("stroke-width", 0.75 / d3.event.transform.k + "px");
        lowMesh.style("stroke-width", 0.5 / d3.event.transform.k + "px");
      }

      function clicked(d) {
        if (active.node() === this) return reset();

        active = d3.select(this);

        var activeDatum = active.datum().properties;

        lowLevelView
          .selectAll(".postcode_area")
          .classed("inactive", function(d) {
            return (d.properties.NAME.startsWith(activeDatum.NAME))
              ? false
              : true;
          });

        active
          .style("stroke-width", "1px")
          .style("stroke-colour", "black");

        var hsBounds = [[100, 205], [125, 355]];

        var bounds = activeDatum.NAME === 'HS' ? hsBounds : path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
            translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      }

      function reset() {
        active = d3.select(null);

        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      }
    });
  }

  draw.width = function(value) {
    if (!arguments.length) return value;
    width = value;

    return draw;
  };

  draw.height = function(value) {
    if (!arguments.length) return value;
    height = value;

    return draw;
  };

  return draw;
}
