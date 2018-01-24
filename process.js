function transform(data) {
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

  var percentagesHigh = _.chain(data)
    .countBy(function(e) { return e.postcode.match(/^([A-Z]+)/)[1]; })
    .mapValues(function(e) {
      return {
        total: e,
        share: e / data.length
      };
    })
    .value();

  var percentagesLow = _.chain(data)
    .countBy(function(e) { return e.postcode; })
    .mapValues(function(e, key) {
      var pc = key.match(/^([A-Z]+)/)[1];
      return {
        total: e,
        share: (e / percentagesHigh[pc].total).toFixed(2)
      };
    })
    .value();

  return {
    high: _.mapValues(percentagesHigh, _.partialRight(_.pick, 'share')),
    low: _.mapValues(percentagesLow, _.partialRight(_.pick, 'share'))
  };
}

