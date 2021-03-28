exports.handler = async event => {
  const url = event.queryStringParameters.url;
  if(!url) { return "Please specify a URL" }
  
  return {
    statusCode: 200,
    body: `Fetching ${url}`,
  }
}
