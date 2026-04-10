const https = require('https');

exports.handler = async function(event) {
  const apiKey = process.env.CRICKET_API_KEY;
  const path = event.queryStringParameters.path || 'currentMatches';
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.cricapi.com',
      path: '/v1/' + path + '?apikey=' + apiKey + '&offset=0',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.end();
  });
};
