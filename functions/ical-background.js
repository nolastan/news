const ical = require('node-ical')
const MongoClient = require('mongodb').MongoClient

exports.handler = async event => {
  console.log('ical import function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('Connecting to Mongo…')
  try {
    console.log("Trying…")
    await client.connect();
    
    const db = client.db('nolatoday')

    getCalendars(db)
      .then( calendars => { return importEvents(calendars) } )
      .then( events => { return saveEvents(db, events) } )
      .catch ( err => {
        console.log("ERROR 3!")
        console.log(err)
      })
  } catch(err) {
    console.log("ERROR 2!")
    console.log(err)
  }
  console.log("End of function.")
}

async function getCalendars(db) {
  console.log("Retrieving list of calendars…")
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
  console.log("Importing events...")
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
    for(const event of events) {
      db
        .collection('events')
        .updateOne({uid: event.uid}, {$set: event}, {upsert: true }, (err, res) => {
          err ? reject(err) : resolve(data)
        })
    }
  })
}
