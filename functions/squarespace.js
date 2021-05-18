const fetch = require('node-fetch')
const microdata = require('scrape-schema');

exports.handler = async event => {
  const url = event.queryStringParameters.url
  var event = {}

  await microdata.parseUrl(url, function(err, json) {
    if (!err && json) {
      for(item of json) {
        if(item.properties["@type"] === "Event") {
            event = item.properties
        }
      }
    }
  });

  const response = {
    statusCode: 200,
    body: JSON.stringify(event),
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return response
}
