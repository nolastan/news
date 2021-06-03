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
    name: "The AllWays Lounge",
    url: "https://theallwayslounge.net/calendar/?ical=1"
  },
  {
    name: "Capulet",
    url: "https://calendar.google.com/calendar/ical/c_qvc2g5hsfmssn65369njqiurfs%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "21st Amendment",
    url: "https://calendar.google.com/calendar/ical/okn90l2menuasgn595qugq85ho%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "Art Klub",
    url: "https://calendar.google.com/calendar/ical/connect.artklub%40gmail.com/public/basic.ics"
  },
  {
    name: "Bacchanal",
    url: "https://calendar.google.com/calendar/ical/bacchanalwine.com_5ph7ranikdn211398hh5i8advs%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "The Blue Crab",
    url: "https://calendar.google.com/calendar/ical/thebluecrabnola.com_obtu0il69hauvremeic6v6smio%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "Casa Borrega",
    url: "http://casaborrega.com/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true&ai1ec_cat_ids=21,25,22"
  },
  {
    name: "Fair Grinds (St. Claude)",
    url: "https://calendar.google.com/calendar/ical/v27e3g34clherajr8g4i7jdv14%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "Fair Grinds",
    url: "https://calendar.google.com/calendar/ical/930lff5q4ec496cgaoph05d5k4%40group.calendar.google.com/public/basic.ics"
  },
  {
    name: "The Spotted Cat",
    url: "https://calendar.google.com/calendar/ical/thespottedcatmusicclub%40gmail.com/public/basic.ics"
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
    console.log(calendar.name)
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
