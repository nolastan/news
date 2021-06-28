const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { JSDOM } = jsdom;

exports.handler = async (event, context) => {
  // const frame = await decoder.takeSnapshot();

  const url = "https://www.clubbamboulas.com/"
  let page = await getPage(url)
  let content = page.getElementById('Containerc1dmp')
  let images = content.querySelectorAll('img')

  for(image of images) {
    image.parentNode.removeChild(image)  
  }

  const formStyles = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  `

  return {
    statusCode: 200,
    headers: {
      'Content-type': 'text/html'
    },
    body: `
      <style>
        input, button { width: 100%; }
      </style>
      ${content.innerHTML}
      <form style="${formStyles}" name="contact" method="POST" data-netlify="true">
        <p>
          <label>Title: <input type="text" name="title" /></label>   
        </p>
        <p>
          <label>Date: <input type="date" name="start" /></label>   
        </p>
        <p>
          <label>Start: <input type="time" name="start" /></label>   
        </p>
        <p>
          <label>End: <input type="time" name="end" value="${new Date()}" /></label>
        </p>
        <p>
          <button type="submit">Save</button>
        </p>
      </form>
    `,
  }
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