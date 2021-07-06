const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { titleCase } = require('title-case')

const DEFAULT_IMAGE_URL = "https://www.nola.today/content/images/size/w2000/2021/04/IMG_2993.jpg"

const { JSDOM } = jsdom;

exports.handler = async event => {
  const bulletin = event.queryStringParameters.bulletin
  const endpoint = `https://lnks.gd/l/${bulletin}`

  let [dom, source] = await getBulletinDom(endpoint)
  
  let title = extractTitle(dom)
  let content = extractContent(dom)
  let tags = applyTags(content)
  let image = extractImage(dom) || applyImage(tags)

  title = titleCase(title.toLowerCase())
  title = shortenTitle(title)

  content = clearWhitespace(content)

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      title, content, image, source, tags
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return response;
}

async function getBulletinDom(endpoint) {
  try {
    console.log(endpoint)
    let response = await fetch(endpoint)
    let page = await response.text()
    page = new JSDOM(page)
    let article = page.window.document.getElementById("bulletin_body")
    return [article, response.url]
  } catch (err) {
    console.log(err.message)
  }
}

function extractTitle(dom) {
  // Mayor uses multiple h1s as line breaks
  // So we need to combine them

  const headingEls = dom.querySelectorAll('h1')
  let titles = []

  for(const headingEl of headingEls) {
    titles.push(headingEl.textContent)
    headingEl.parentNode.removeChild(headingEl)
  }

  return titles.join(" ")
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
  content = removeTrackingCodes(dom).innerHTML

  if(content.includes("NEW ORLEANS —&nbsp;")) {
    content = content.split("NEW ORLEANS —&nbsp;")[1]
  }
  if(content.includes("NEW ORLEANS — ")) {
    content = content.split("NEW ORLEANS — ")[1]
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
  content = content.split("</p>\n<p").join("</p><p")
  content = content.split("<br>").join("")
  return content
}

function removeTrackingCodes(dom) {
  const linkEls = dom.querySelectorAll("a[href]")

  linkEls.forEach(el => {
    let linkUrl = el.getAttribute('href')
    
    // Remove utm parameters
    linkUrl = linkUrl.replace(/(?<=&|\?)utm_.*?(&|$)/igm, "");

    // Remove trailing `?`
    linkUrl = linkUrl.replace(/\?$/, "");
    
    el.setAttribute('href', linkUrl)
  })

  return dom
}

function applyTags(content) {
  const tags = require('../tags.json')
  let result = []

  for(const tag of tags) {
    for(const trigger of tag.triggers) {
      // TODO regex to include punctuation
      if(content.includes(" " + trigger + " ")) {
        result.push({
          tag: tag.name, // TODO rename to `name` + update Zapier
          image: tag.image,
          trigger
        })
        break
      }
    }
  }

  return result
}

function applyImage(tags) {
  if(tags.length > 0) {
    return tags[0].image
  } else {
    return DEFAULT_IMAGE_URL
  }
}
