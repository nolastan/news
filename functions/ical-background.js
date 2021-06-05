const ical = require('node-ical')
const MongoClient = require('mongodb').MongoClient

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

exports.handler = async event => {
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('nolatoday')

  let result = await getCalendars(db)
    .then( async calendars => { return await importEvents(calendars) } )
    .then( events => { return saveEvents(db, events) } )

  return result
}

async function getCalendars(db) {
  return new Promise(async (resolve, reject) => {
    let calendars = await db
      .collection('calendars')
      .find({format: 'ics'})
      .toArray()
    console.log(`calendars: ${JSON.stringify(calendars)}`)
    resolve(calendars)
 })
}

async function importEvents(calendars) {
  return new Promise(async (resolve, reject)=> {
    let events = []

    for(const calendar of calendars) {
      let data = await ical.async.fromURL(calendar.url)
      events.push(...processICS(data, calendar.name))
    }

    resolve(events)
  })
}

function processICS(data, venue) {
  let events = []
  const now = new Date()
  for(const key in data) {
    const event = data[key]
    if(event.type == 'VEVENT') {
      if(new Date(event.start) > now && event.summary) {
        event.venue = venue
        events.push(event)
        console.log(`Imported "${event.summary}" from ${venue}.`)
      }
    }
  }
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
