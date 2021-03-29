exports.handler = async event => {

  const bulletin = event.queryStringParameters.bulletin;
  const url = `https://lnks.gd/l/${bulletin}`;

  const fetch = require("node-fetch");
  var jsdom = require('jsdom');
  const { JSDOM } = jsdom;

  let request = await fetch(url);
  let text = await request.text();

  // Get DOM
  const dom = await new JSDOM(text);
  var bodyEl = dom.window.document.querySelector("#main-body");

  // Remove Headline
  const headline = bodyEl.querySelector("h1");
  if(headline) {
    bodyEl.removeChild(headline);
  }

  // Get Image
  const imageEl = bodyEl.querySelector('.govd_template_image');
  var imageUrl;
  if(imageEl) {
    imageUrl = imageEl.getAttribute('src');
    bodyEl.removeChild(imageEl);
  }

  // Remove extra footer characters
  var html = bodyEl.innerHTML;
  html = html.replace("# # #", ""); // random characters at end of press releases

  const response = {
      statusCode: request.status,
      body: JSON.stringify({
        html: html,
        image: imageUrl
      }),
      header: request.headers
  };

  return response;
}
