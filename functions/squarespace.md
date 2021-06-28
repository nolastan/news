For each venue
  fetch rss
  For each item
    If in future
      fetch squarespace URL
      parse microdata
      upsert to mongo



```

  await microdata.parseUrl(url, function(err, json) {
    if (!err && json) {
      for(item of json) {
        if(item.properties["@type"] === "Event") {
            event = item.properties
        }
      }
    }
  });

  ```