const ical = require('node-ical');
const MongoClient = require('mongodb').MongoClient;

// TODO: load list of calendars from mongo
const calendars = [
  {
    name: "30°/90°",
    url: "https://calendar.google.com/calendar/ical/qpdvh5gisi5fdb8p9s9m2dsq5s%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "MRB",
    url: "https://mrbnola.com/events/?ical=1"
  },
  {
    name: "Scatter Jazz",
    url: "https://scatterjazz.com/events/?ical=1"
  },
  {
    name: "Capulet",
    url: "https://calendar.google.com/calendar/ical/c_qvc2g5hsfmssn65369njqiurfs%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "Bacchanal",
    url: "https://calendar.google.com/calendar/ical/bacchanalwine.com_5ph7ranikdn211398hh5i8advs%40group.calendar.google.com/public/basic.ics"
  }
]

exports.handler = async event => {
  const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net/nolatoday?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const events = await importEvents(calendars)
  saveEvents(client, events)
}

async function saveEvents(client, events) {
  client.connect(err => {
    const collection = client.db("nolatoday").collection("events");
    for(event of events) {
      collection.updateOne({uid: event.uid}, {$set: event}, {upsert: true }, function(err, res) {
        if (err) throw err;
      })
    }
  })
}

async function importEvents(calendars) {
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
        }
      }
    }
  }

  return events
}
