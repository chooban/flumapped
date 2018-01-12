var width = 960,
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

var projection = d3.geo.albers()
  .center([0, 55.4])
  .rotate([4.4, 0])
  .parallels([50, 60])
  .scale(1200 * 5)
  .translate([width / 2, height / 2]);

var path = d3.geo.path()
  .projection(projection);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

d3.json("uk-postcode-area.json", function(err, uk) {
  if (!err) {
    var areas = uk.objects['uk-postcode-area'].geometries.filter(function(a) {
      return scottishPostcodes.includes(a.id);
    });

    svg.selectAll(".subunit")
      .data(topojson.feature(uk, {
        type: 'GeometryCollection',
        geometries: areas
      }).features)
      .enter()
        .append("path")
          .attr("class", "feature")
          .attr("d", path);
  }
});
