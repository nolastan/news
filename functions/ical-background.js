const ical = require('node-ical')
const MongoClient = require('mongodb').MongoClient

exports.handler = async event => {
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net/nolatoday?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}
  
  try {
    MongoClient.connect(connectionStr, connectionOpts, (err, client) => {
      if (err) throw err
      const db = client.db('nolatoday')

      var getCalendarsPromise = async () => {
        var calendars = await (getCalendars(db))
        return calendars
      }

      var getEventsPromise = async (calendars) => {
        const events = await importEvents(calendars)
        return events
      }

      getCalendarsPromise().then( calendars => {
        getEventsPromise(calendars).then( events => {
          saveEvents(db, events)
        })
      })
    })
  } catch (e) {
    console.log(`Error: ${e}`)
  }
}

async function getCalendars(db) {
  return new Promise((resolve, reject) => {
    db
     .collection('calendars')
     .find()
     .toArray( (err, data) => {
         err 
            ? reject(err) 
            : resolve(data)
       })
 })
}

async function importEvents(calendars) {
  return new Promise(async (resolve, reject)=> {
    let events = []
    const now = new Date()
  
    for(const calendar of calendars) {
      data = await ical.async.fromURL(calendar.url)
      for(const key in data) {
        const event = data[key]
        if(event.type == 'VEVENT') {
          if(new Date(event.start) > now && event.summary) {
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
    for(event of events) {
      db
        .collection('events')
        .updateOne({uid: event.uid}, {$set: event}, {upsert: true }, (err, res) => {
          err ? reject(err) : resolve(data)
        })
    }
  })
}
