function uploadFile(file) {
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    alert('The File APIs are not fully supported in this browser.');
  }

  if (file.type != "text/tab-separated-values") {
    window.alert("Must be a TSV file");
    return;
  }

  var reader = new FileReader();

  reader.onload = function(e) {
    var tsv = d3.tsvParse(e.target.result);

    d3.queue()
      .defer(d3.json, "data/scotland-postcode.topo.json")
      .await(function(err, map) {
        console.log(distances(tsv, map));
      });
  };

  reader.readAsText(file);
}

function distances(postcodes, map) {
  var width = 500;
  var height = 600;
  var projection = d3.geoAlbers()
    .center([0, 55.4])
    .rotate([4.4, -2])
    .parallels([50, 60])
    .scale(1200 * 4)
    .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection);

  var features = topojson.feature(map, map.objects['uk-postcodes-xxnn-area']).features;
  var centroids = _.chain(features)
    .keyBy('properties.NAME')
    .mapValues(function(f) { return projection.invert(path.centroid(f)); })
    .value();

  return postcodes.map(function(row) {
    var pcA = centroids[row["From"]];
    var pcB = centroids[row["To"]];

    var rad = d3.geoDistance(pcA, pcB);

    return [
      row["From"],
      row["To"],
      (rad * 6378.1).toFixed(2)
    ];
  });
}
