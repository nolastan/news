let Parser = require('rss-parser')
let parser = new Parser()
const microdata = require('scrape-schema');

const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('squarespace import function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('cms')

  let result = await getCalendars(db)
    .then( async calendars => importEvents(calendars, db) )

  return result
}

// TODO DRY
async function getCalendars(db) {
  return new Promise(async (resolve, reject) => {
    let calendars = await db
      .collection('venues')
      .find({Format: 'squarespace'})
      .toArray()
    resolve(calendars)
 })
}

async function importEvents(venues, db) {
  console.log("Importing events...")
  return new Promise(async (resolve, reject)=> {
    for(const venue of venues) {
      console.log("Importing events from " + venue.Name)
      let data = await parser.parseURL(venue.CalendarURL)
      processMicrodata(data, venue._id, db)
    }
  })
}

async function processMicrodata(data, venue, db) {
  data.items.forEach(rawEvent => {

    microdata.parseUrl(rawEvent.link, function(err, json) {
      if (!err && json) {
        for(item of json) {
          if(item.properties["@type"] === "Event") {
            let startDate = new Date(item.properties.startDate)
            if(startDate > now) {
              let newEvent = {
                Title: item.properties.name.split(' — ')[0].trim(),
                Start: startDate,
                End: new Date(item.properties.endDate),
                uid: item.id,
                venue,
                URL: rawEvent.link
              }
              saveEvent(db, newEvent)
            }
          }
        }
      }
    });
  })
}

// TODO DRY
async function saveEvent(db, event) {
  console.log(`Upserting ${event.Title}`)
  return new Promise((resolve, reject) => {
    db
      .collection('music_events')
      .updateOne({uid: event.uid}, {$set: event},
      {upsert: true}, (err, res) => {
        err ? reject(err) : resolve(res)
      })
  })
}