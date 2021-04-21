const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { decode } = require('html-entities')
const { titleCase } = require('title-case')

const DEFAULT_IMAGE_URL = "" // TODO pic of Tulane

const { JSDOM } = jsdom;

exports.handler = async event => {

  let title = decode(event.queryStringParameters.title)
  let rawContent = decode(event.body)
  let source = event.queryStringParameters.source

  const dom = new JSDOM(rawContent).window.document

  let content = extractContent(dom)
  let image = extractImage(dom)
  let excerpt = extractExcerpt(dom)

  let tags = [{ name: "Education" }]

  title = titleCase(title.toLowerCase())

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      title, content, image, source, tags, excerpt
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

function extractImage(dom) {
  let imageUrl

  const imageEl = dom.querySelector('img')
  if(imageEl) {
    imageUrl = imageEl.getAttribute('src')
    imageEl.parentNode.removeChild(imageEl)
  }
  return imageUrl
}

function extractContent(dom) {
  let paragraphs = dom.querySelectorAll("p")
  let article = [...paragraphs].map(x => x.innerHTML).join("</p><p>")
  article = `<p>${article}</p>`
  return article
}

function extractExcerpt(dom) {
  // TODO refactor to actually extract from base dom
  let excerpt = dom.querySelector(".field--name-field-synopsis")
  if(excerpt) {
    return excerpt.textContent.substring(0, 300)
  }
}
