// This approach is a stop-gap.
// This would be better done in Strapi lifecycle hooks.

const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('add artist to venues function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('cms')

  let events = await getEvents(db)
  let artists = await getArtists(db)

  const result = matchEventsToArtists(events, artists, db)

  return result
}

async function getArtists(db) {
  return new Promise(async (resolve, reject) => {
    let artists = await db
      .collection('artists')
      .find()
      .toArray()
    resolve(artists)
 })
}

async function getEvents(db) {
  return new Promise(async (resolve, reject) => {
    let events = await db
      .collection('music_events')
      .find({
        Start: { $gte: now }
      })
      .toArray()
    resolve(events)
 })
}

function matchEventsToArtists(events, artists, db) {
  console.log(`matching ${events.length} events to ${artists.length} artists...`)
  for(const event of events) {
    for(const artist of artists) {
      const eventTitle = event.Title.replace(/[^\w\s]/gi, '').toLowerCase()
      const artistName = artist.name.replace(/[^\w\s]/gi, '').toLowerCase()
     
      if(eventTitle.includes(artistName)) {
        saveMatch(event, artist, db)
      }
    
    }
  }
}

function saveMatch(event, artist, db) {
  if(artist.music_events) {
    if(!JSON.stringify(artist.music_events).includes(event._id)) {
      console.log(`New match: ${artist.name} // ${event.Title}`)
      artist.music_events.push(event._id)
    }
  } else {
    artist.music_events = [event._id]
  }

  db
    .collection('artists')
    .updateOne(
      {_id: artist._id},
      {$set: artist},
      {upsert: true}
    )
}