const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { titleCase } = require('title-case')

const { JSDOM } = jsdom;

exports.handler = async event => {
  const bulletin = event.queryStringParameters.bulletin
  const endpoint = `https://lnks.gd/l/${bulletin}`

  let [dom, source] = await getBulletinDom(endpoint)
  
  let title = extractHeadline(dom)
  let image = extractImage(dom)
  let content = extractContent(dom)

  title = titleCase(title.toLowerCase())
  title = shortenTitle(title)

  content = clearWhitespace(content)
  // TODO Apply tags
  // TODO Trim intro and footer
  // TODO common replacements/removals

    // LINKS
      // TODO Remove tracking params
      // TODO Create visual bookmark

  // IMAGE
    // TODO If no image, apply based on tags

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        title, content, image, source
      }),
      headers: {
        'Content-Type': 'application/json'
      }
  };

  return response;
}

async function getBulletinDom(endpoint) {
  try {
    let response = await fetch(endpoint)
    let page = await response.text()
    page = new JSDOM(page)
    let article = page.window.document.querySelector("#main-body")
    return [article, response.url]
  } catch (err) {
    console.log(err.message)
  }
}

function extractHeadline(dom) {
  const headline = dom.querySelector('h1')
  if(headline) {
    headline.parentNode.removeChild(headline)
  }
  return headline.textContent
}

function extractImage(dom) {
  let imageUrl
  
  const imageEl = dom.querySelector('.govd_template_image')
  if(imageEl) {
    imageUrl = imageEl.getAttribute('src')
    imageEl.parentNode.removeChild(imageEl)
  }
  return imageUrl
}

function extractContent(dom) {
  content = dom.textContent
  if(content.includes("NEW ORLEANS —")) {
    content = content.split("NEW ORLEANS —")[1]
  }
  content = content.split("# # #")[0]
  return content
}

function shortenTitle(title) {
  title = title.replace('City of New Orleans', 'City')
  title = title.replace('City Announces ', '')
  title = title.replace('MAYOR CANTRELL ANNOUNCES ', '')
  return title
}

function clearWhitespace(content) {
  content = content.trim()
  content = content.split(/\n\s\n/).join("\n")
  return content
}
