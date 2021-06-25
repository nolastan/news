const fetch = require('node-fetch')
const { titleCase } = require('title-case')
 
const MongoClient = require('mongodb').MongoClient
const now = new Date()

exports.handler = async event => {
  console.log('construction import function triggered')
  const connectionStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@nola.uiwnl.mongodb.net?retryWrites=true&w=majority`
  const connectionOpts = {useNewUrlParser: true, useUnifiedTopology: true}

  const client = new MongoClient(connectionStr, connectionOpts);

  await client.connect();

  const db = client.db('cms')

  const url = "https://data.nola.gov/resource/rcm3-fn58.json?$order=currentstatusdate%20DESC&type=New%20Construction&currentstatus=Permit%20Issued&$limit=25"
  let res = await fetch(url)
  let constructions = await res.json()

  for(const construction of constructions) {
    console.log(`upserting ${construction.address}`)
    db.collection('constructions')
    .updateOne({ uid: construction.numstring }, 
      {$set:
        {
          owner: construction.owner,
          address: construction.address,
          description: construction.description,
          issued: new Date(construction.issuedate),
          landUse: construction.landuse,
          zoning: construction.zoning,
          cost: parseInt(construction.constrval),
          comments: parseInt(construction.opencomments),
          applicant: construction.applicant,
          contractor: construction.contractors,
          beds: parseFloat(construction.beds),
          baths: parseFloat(construction.baths),
          hasSecondFloor: !!construction.secondfloor,
          daysOpen: parseInt(construction.daysopen),
          neighborhood: construction.subdivision,
          councilDistrict: construction.councildist,
          historicDistrict: construction.historicdistrict,
          lat: parseFloat(construction.location_1.latitude),
          lng: parseFloat(construction.location_1.longitude),
          uid: construction.numstring
        }
      }, {upsert: true }
    )
  }
  return "done"
}

