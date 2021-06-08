const ical = require('node-ical')
let Parser = require('rss-parser')
let parser = new Parser()

const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('ical import function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('nolatoday')

  let result = await getCalendars(db)
    .then( async calendars => await importEvents(calendars) )
    .then( events => saveEvents(db, events) )

  return result
}

// TODO DRY
async function getCalendars(db) {
  return new Promise(async (resolve, reject) => {
    let calendars = await db
      .collection('calendars')
      .find({format: 'eventbrite'})
      .toArray()
    resolve(calendars)
 })
}

async function importEvents(calendars) {
  console.log("Importing events...")
  return new Promise(async (resolve, reject)=> {
    let events = []

    for(const calendar of calendars) {
      console.log("Importing events from " + calendar.name)
      let data = await parser.parseURL(calendar.url)
      events.push(...processICS(data, calendar.name))
    }
    resolve(events)
  })
}

function processICS(data, venue) {
  let events = []
  data.items.forEach(rawEvent => {

    let times = rawEvent.content.trim()
      .replace(' at', '')
      .replace(' from', '')
      .replace('\r\n        ', '')
      .split('<br /><br />')[0]
      .split('<b>When:</b><br />')[1]
      .split(' <span class="pipe">-</span> ')

    if(!times[1]) {
      times = times[0].split(' to ')
    }

    let timestamp = Date.parse(times[0])
    let startDate = new Date(timestamp)

    if(startDate > now) {
      let event = {
        summary: rawEvent.title,
        url: rawEvent.link,
        created: rawEvent.pubDate,
        uid: rawEvent.guid,
        start: startDate,
        // end: times[1] // TODO format into date
        venue,
        timestamp
      }

      event.description = rawEvent.content 
        .split('<b>Event Details:</b><br />')[1]
        .split('<br /><br />')[0]
        .trim()

      console.log(`Imported "${event.summary}" (${event.start}) from ${event.venue}.`)
      events.push(event)
    }
  })

  return events
}

async function saveEvents(db, events) {
  console.log(`Upserting ${events.length} events.`)
  return new Promise((resolve, reject) => {
    for(const event of events) {
      db
        .collection('events')
        .updateOne({uid: event.uid}, {$set: event}, {upsert: true }, (err, res) => {
          err ? reject(err) : resolve(res)
        })
    }
  })
}