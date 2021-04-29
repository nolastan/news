const fetch = require('node-fetch')
const jsdom = require('jsdom')

const DEFAULT_IMAGE_URL = "" // TODO

const { JSDOM } = jsdom;

exports.handler = async event => {
  const url = "https://www.filmneworleans.org/productions/"
  let page = await getPage(url)
  let tiles = page.querySelectorAll('.production')
  let productions = []
  
  for(tile of tiles) {
    productions.push({
      title: tile.querySelector(".production__title").textContent,
      details: tile.querySelector(".production__details") && tile.querySelector(".production__details").textContent,
      type: tile.querySelector(".production__type").textContent,
      start_date: tile.querySelector(".production__start-date").textContent,
      end_date: tile.querySelector(".production__end-date").textContent,
    })
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(productions),
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return response
}


async function getPage(url) {
  try {
    let response = await fetch(url)
    let page = await response.text()
    page = new JSDOM(page)
    page = page.window.document
    return page
  } catch (err) {
    console.log(err.message)
  }
}