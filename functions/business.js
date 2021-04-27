const dotenv = require('dotenv')
const { titleCase } = require('title-case')
const fetch = require('node-fetch')

const DEFAULT_IMAGE_URL = "" // TODO

exports.handler = async event => {
  dotenv.config()

  let name = event.queryStringParameters.name
  let streetname = event.queryStringParameters.streetname
  let owner = event.queryStringParameters.owner
  let type = event.queryStringParameters.type
  let address = event.queryStringParameters.address
  let lng = event.queryStringParameters.lng
  let lat = event.queryStringParameters.lat
  let startDate = event.queryStringParameters.startDate
  
  let mapImage = getMapImage(lat, lng)
  let streetViewImage = getStreetViewImage(lat, lng)
  let previousTenants = await getPreviousTenants(address)
  let headline = writeHeadline(name, streetname, previousTenants, type)

  let instagram = await getInstagramHandle(name)

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      headline: headline,
      image: streetViewImage,
      content:`
        <p>${owner} to open a ${type} at ${address}, according to a license filed with the City on ${formatDate(startDate)}.</p>
        <p>Follow <a href="https://instagram.com/${instagram}">@${instagram} on Instagram</a> for updates.</p>
        <img src=${mapImage} alt="map" />`,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return response;
}

function getStreetViewImage(lat, lng) {
  var src = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lng},${lat}&fov=120&key=${process.env.GOOGLE_KEY}`
  return src
}

function getMapImage(lat, lng) {
  var base_url = `https://api.mapbox.com/styles/v1`
  var marker_style = `pin-l-building`
  var marker_color = `f4f7f7`
  var marker = `${marker_style}+${marker_color}(${lng},${lat})`
  var map_style = `nolastan/cknc9bfbz1teg17p9blgfae26`
  var src = `${base_url}/${map_style}/static/${marker}/${lng},${lat},15,0,52/1200x600?access_token=${process.env.MAPBOX_TOKEN}`
  return src
}

async function getPreviousTenants(address) {
  var endpoint = `https://data.nola.gov/resource/sbc5-uppx.json?address=${address.toUpperCase()}`
  var output = []
  try {
    let response = await fetch(endpoint)
    let tenants = await response.json()

    for(tenant of tenants) {
      output.push(titleCase(tenant.businessname.toLowerCase()))
      console.log(output)
    }
  } catch (err) {
    console.log(err.message)
  }
  return output
}

function writeHeadline(business, streetname, previousTenants, type) {
  business_name = titleCase(business.toLowerCase())
  if(previousTenants.length > 0) {
    return `${business_name} Coming to Former ${previousTenants[0]} Location`
  } else {
    return `${business_name} to Open ${type} on ${titleCase(streetname.toLowerCase())}`
  }

}

async function getInstagramHandle(name) {
  var endpoint = `https://duckduckgo.com/?q=!ducky+site%3Ainstagram.com+${name}+New+Orleans`
  try {
    let response = await fetch(endpoint)
    let profile = await response.text()
    let username = profile.split("instagram.com%2F")[1]
    username = username.split("&rut")[0]
    return username
  } catch (err) {
    console.log(err.message)
  }
}

function embedMap(address) {

}

function formatDate(dateString) {
  var date = Date.parse(dateString)
  return new Intl.DateTimeFormat('en', {
    month: "long", 
    day: "numeric",
    year: "numeric"
  }).format(date)
}