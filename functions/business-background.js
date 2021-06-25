const fetch = require('node-fetch')
const { titleCase } = require('title-case')
 
const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('business import function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('cms')

  const url = "https://data.nola.gov/resource/hjcd-grvu.json?$order=BusinessStartDate%20DESC&$limit=25"
  let res = await fetch(url)
  let businesses = await res.json()

  for(const business of businesses) {
    console.log(`upserting ${business.businessname}`)
    db.collection('businesses')
    .updateOne({ uid: business.businesslicensenumber }, 
      {$setOnInsert:
        {
          name: business.businessname && titleCase(business.businessname.toLowerCase()),
          owner: business.ownername && titleCase(business.ownername.toLowerCase()),
          start: business.businessstartdate,
          streetNumber: business.streetnumber,
          streetName: business.streetname && titleCase(business.streetname.toLowerCase()),
          streetSuffix: business.streetsuffix && titleCase(business.streetsuffix.toLowerCase()),
          zip: business.zip,
          lat: business.latitude,
          lng: business.longitude,
          uid: business.businesslicensenumber
        }
      }, {upsert: true }
    )
  }
  return "done"
}

