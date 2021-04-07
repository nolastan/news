const { link } = require("fs");

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
    headline.parentNode.removeChild(headline);
  }

  // Get Image
  const imageEl = bodyEl.querySelector('.govd_template_image');
  var imageUrl;
  if(imageEl) {
    imageUrl = imageEl.getAttribute('src');
    imageEl.parentNode.removeChild(imageEl);
  }

  // Replace URLs
  const linkEls = bodyEl.querySelectorAll("a[href]");

  linkEls.forEach(el => {
    let linkUrl = el.getAttribute('href');
    el.setAttribute('href', cleanUrl(linkUrl));
  });

  // begin HTML transformations

  // Remove extra footer characters
  var html = bodyEl.innerHTML;
  html = html.replace("# # #", "");

  // Remove "NEW ORLEANS —" intro
  html = html.replace("NEW ORLEANS — ", "");


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

function cleanUrl(url) {

  // Remove utm parameters
  url = url.replace(/(?<=&|\?)utm_.*?(&|$)/igm, "");

  // Remove trailing `?`
  url = url.replace(/\?$/, "");

  return url;

}
