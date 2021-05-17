const fetch = require('node-fetch')

exports.handler = async event => {
  const url = "https://google-calendar.galilcloud.wixapps.net/_api/getEvents?compId=ic39t6lb&instance=C_f3VLCn80mZ3GWmynF8rNZkkI6R2fcbaUM3sDTP0Dk.eyJpbnN0YW5jZUlkIjoiMTNhZjM2YjMtOGVlOC05MmNhLWU3ZTAtZjE2MGY5MjIyZGFkIiwiYXBwRGVmSWQiOiIxMjlhY2I0NC0yYzhhLTgzMTQtZmJjOC03M2Q1Yjk3M2E4OGYiLCJtZXRhU2l0ZUlkIjoiNWM5ZWJkODctMzVlMi00MjQwLTg2MjYtNWFiZGIyZjg4N2Q3Iiwic2lnbkRhdGUiOiIyMDIxLTA1LTE3VDIxOjQ5OjEyLjE2N1oiLCJkZW1vTW9kZSI6ZmFsc2UsImFpZCI6IjNlNjQyYWIyLWE0NTctNDI5Mi04MmJkLTc3NTAxOTRlMjQ1MiIsImJpVG9rZW4iOiI0ZjMxOGIzNC1iYjBhLWQwOGEtNjFjNi1hYmRkNGJkYWFhN2EiLCJzaXRlT3duZXJJZCI6ImIwZGM1MzVkLTU0MjctNDY5Yi05NzI5LTZiYzRhOTM2MDY4MSJ9&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22bsi%22%3A%2268dbd5c9-fbad-48a0-8b50-e20ba1657c3d%7C1%22%2C%22BSI%22%3A%2268dbd5c9-fbad-48a0-8b50-e20ba1657c3d%7C1%22%7D&vsi=a753ffb4-12d8-4bd3-9d43-226e70d69674"
  let res = await fetch(url)
  let json = await res.json()

  let events = [];
  let data = json.eventsByDates;
  for(date in data){
    events.push(...data[date])
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(events),
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return response
}
