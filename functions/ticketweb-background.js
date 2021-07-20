const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { JSDOM } = jsdom;

const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('ticketweb import function triggered')
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
      .find({Format: 'ticketweb'})
      .toArray()
    resolve(calendars)
 })
}

async function importEvents(venues, db) {
  console.log("Importing events...")
  for(const venue of venues) {
    scrape(venue.CalendarURL, venue._id, db)
  }
}

async function scrape(url, venue, db) {
  fetch(url, { headers: { 'User-Agent': "NOLA.Today" } } )
  .then(response => response.text())
  .then(extractMicrodata)
  .then(events => {
    for(const event of events) {
      saveEvent(event, venue, db)
    }
  })
}

function saveEvent(rawEvent, venue, db) {
  let event = {
    Title: rawEvent.name,
    Start: new Date(rawEvent.startDate),
    uid: rawEvent.url,
    venue,
    URL: rawEvent.url
  }

  db
    .collection('music_events')
    .updateOne(
      {uid: event.uid},
      {$set: event},
      {upsert: true}
    )
}

function extractMicrodata(html) {
  const dom = new JSDOM(html)
  const page = dom.window.document
  const schema = page.querySelector('script[type="application/ld+json"]')
  const data = JSON.parse(schema.textContent)
  return data
}
