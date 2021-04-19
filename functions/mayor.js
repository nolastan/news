const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { titleCase } = require('title-case')

const { JSDOM } = jsdom;

exports.handler = async event => {
  const bulletin = event.queryStringParameters.bulletin
  const source = `https://lnks.gd/l/${bulletin}`

  let dom = await getBulletinDom(source)
  
  let title = extractHeadline(dom)
  let image = extractImage(dom)
  let content = extractContent(dom)
  // get redirected `source`

  title = titleCase(title.toLowerCase())
  title = shortenTitle(title)

  content = clearWhitespace(content)
  // Apply tags
  // Trim intro and footer
  // common replacements/removals

    // LINKS
      // Remove tracking params
      // Create visual bookmark

  // IMAGE
    // If no image, apply based on tags

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

async function getBulletinDom(source) {

  let response, page, article
  try {
    response = await fetch(source)
    page = await response.text()
    page = new JSDOM(page)
    article = page.window.document.querySelector("#main-body")
    return article
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
