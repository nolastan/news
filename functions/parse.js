exports.handler = async event => {
  const bulletin = event.queryStringParameters.bulletin;
  const url = `https://content.govdelivery.com/accounts/LANOLA/bulletins/${bulletin}`;

  const fetch = require("node-fetch");
  var jsdom = require('jsdom');
  const { JSDOM } = jsdom;

    let request = await fetch(url);
    let text = await request.text();

    const dom = await new JSDOM(text);
    html = dom.window.document.querySelector("#main-body").innerHTML;
    html = `
      <html>
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type">
        </head>
        <body>
          ${html}
        </body>
      </html>  
    `

    const response = {
        statusCode: request.status,
        body: html,
        header: request.headers
    };

    return response;
}
