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
    var transformedData = transform(tsv);

    d3.queue()
      .defer(d3.json, "data/scotland-postcode.topo.json")
      .await(function(err, map) {
        download(JSON.stringify(transformedData), "flu-map-data.json");
        d3.select(".map")
          .datum({
            map: map,
            data: transformedData
          })
          .call(flumap());
      });
  };

  reader.readAsText(file);
}

function download(data, filename) {
  var blob = new Blob([data], {
    type: 'text/csv'
  });

  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // IE workaround for "HTML7007: One or more blob URLs were
    // revoked by closing the blob for which they were created.
    // These URLs will no longer resolve as the data backing
    // the URL has been freed."
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var tempLink = document.createElement('a');
    tempLink.appendChild(document.createTextNode("Download data"));
    tempLink.href = window.URL.createObjectURL(blob);
    tempLink.setAttribute('download', filename);
    tempLink.setAttribute('target', '_blank');
    document.body.appendChild(tempLink);
  }
}
