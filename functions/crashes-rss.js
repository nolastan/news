const fetch = require('node-fetch')
const { titleCase } = require('title-case')


exports.handler = async event => {
  const url = "https://eocgis.nola.gov:6443/arcgis/rest/services/Streetwise/Traffic_Inc_21_UPASS/MapServer/0/query?f=json&where=(1%3D1)%20AND%20(1%3D1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=ESRI_OID%20ASC&outSR=102100&resultOffset=0&resultRecordCount=50"
  const json = await fetch(url).then(data => data.json())
  const crashes = json.features
  console.log(JSON.stringify(crashes))

  let items = ``

  for(const crash of crashes) {
    let title = titleCase(crash.attributes.TypeText.toLowerCase())
    title = title.replace('Auto Accident with Injury', 'Vehicle Violence')
    title = title.replace('Auto Accident', 'Vehicle Crash')

    const date = new Date(crash.attributes.TimeCreate).toUTCString()
    let location = titleCase(crash.attributes.Address.toLowerCase())
    if(crash.attributes.CommonName) {
      location = `${titleCase(crash.attributes.CommonName.toLowerCase())} at ${location}`
    }
    
    items += `
    <item>
      <title>${title}</title>
      <link>https://nola.today</link>
      <description>${location}</description>
      <pubDate>${date}</pubDate>
      <guid isPermaLink="false">nola-today-crashes-${crash.attributes.Incident}</guid>
    </item>`
  }
  
  let rss = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NOLA Crashes</title>
    <link>https://twitter.com/crashnola</link>
    <description>Realtime feed of vehicle crashes in New Orleans</description>
    <atom:link href="https://server.nola.today/.netlify/functions/crashes-rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  const response = {
    statusCode: 200,
    body: rss,
    headers: {
      'Content-Type': 'application/rss+xml'
    }
  }

  return response
}


async function getPage(url) {
  try {
    let page = await response.text()
    page = new JSDOM(page)
    page = page.window.document
    return page
  } catch (err) {
    console.log(err.message)
  }
}