const ical = require('node-ical')
const MongoClient = require('mongodb').MongoClient

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

exports.handler = async event => {
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}
  
  MongoClient.connect(connectionStr, connectionOpts, (err, client) => {
    if (err) throw err
    const db = client.db('nolatoday')

    getCalendars(db)
      .then( calendars => { return importEvents(calendars) } )
      .then( events => { return saveEvents(db, events) } )
  })
}

async function getCalendars(db) {
  return new Promise((resolve, reject) => {
    db
      .collection('calendars')
      .find({format: 'ics'})
      .toArray( (err, data) => {
        err ? reject(err) : resolve(data)
      })
 })
}

async function importEvents(calendars) {
  return new Promise(async (resolve, reject)=> {
    let events = []
    const now = new Date()
  
    for(const calendar of calendars) {
      console.log('loading calendar: ' + calendar.name)
      data = await ical.async.fromURL(calendar.url)
      for(const key in data) {
        console.log('importing events from ' + calendar.name)
        const event = data[key]
        if(event.type == 'VEVENT') {
          if(new Date(event.start) > now && event.summary) {
            console.log('upcoming event found for ' + calendar.name)
            event.venue = calendar.name
            events.push(event)
            console.log(`Imported "${event.summary}" from ${calendar.name}.`)
          }
        }
      }
    }
    resolve(events)
  })
}

async function saveEvents(db, events) {
  console.log(`Upserting ${events.length} events.`)
  return new Promise((resolve, reject) => {
    for(const event of events) {
      db
        .collection('events')
        .updateOne({uid: event.uid}, {$set: event}, {upsert: true }, (err, res) => {
          err ? reject(err) : resolve(data)
        })
    }
  })
}
