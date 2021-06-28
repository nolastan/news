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
    .then( async calendars => await importEvents(calendars) )
    .then( events => saveEvents(db, events) )

  return result
}

// TODO DRY
async function getCalendars(db) {
  return new Promise(async (resolve, reject) => {
    let calendars = await db
      .collection('venues')
      .find({Format: 'squarespace'})
      .limit(1)
      .toArray()
    resolve(calendars)
 })
}

async function importEvents(venues) {
  console.log("Importing events...")
  return new Promise(async (resolve, reject)=> {
    let events = []

    for(const venue of venues) {
      console.log("Importing events from " + venue.Name)
      let data = await parser.parseURL(venue.CalendarURL)
      console.log(`Found ${data.items.length} events`)


      // PROMISE ISSUES vvv

      let newEvents = await processMicrodata(data, venue._id)
        .then(events => events)
      console.log(`Pushing ${newEvents.length} new events`)
      events.push(...newEvents)
      console.log(`Now have ${events.length} total events`)



    }
    resolve(events)
  })
}

async function processMicrodata(data, venue) {
  return new Promise(async (resolve, reject) => {
    let events = []
    data.items.forEach(rawEvent => {
      // console.log(`Processing ${rawEvent.title} ${rawEvent.link}`)

      microdata.parseUrl(rawEvent.link, function(err, json) {
        if (!err && json) {
          for(item of json) {
            if(item.properties["@type"] === "Event") {
            // if(item.properties.startDate > now) {
                let newEvent = {
                  Title: item.properties.name,
                  Start: item.properties.startDate,
                  End: item.properties.endDate,
                  UID: item.id,
                  venue
                }
                console.log(`Imported ${newEvent.Title}`)
                events.push(newEvent)
                console.log(`events has ${events.length} events`)
            // }
            }
          }
        }
      });
    })
    resolve(events)
  })
}

// TODO DRY
async function saveEvents(db, events) {
  console.log(`Upserting ${events.length} events.`)
  return new Promise((resolve, reject) => {
    for(const event of events) {
      db
        .collection('music_events')
        .updateOne({uid: event.uid}, {$set: event},
        {upsert: true}, (err, res) => {
          err ? reject(err) : resolve(res)
        })
    }
  })
}
