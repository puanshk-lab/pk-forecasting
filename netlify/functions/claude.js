const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);

  // Support both Sonnet and Haiku
  const allowedModels = [
    'claude-sonnet-4-20250514',
    'claude-haiku-4-5-20251001'
  ];
  const model = allowedModels.includes(body.model) ? body.model : 'claude-sonnet-4-20250514';

  const payload = {
    model: model,
    max_tokens: body.max_tokens || 1000,
    system: body.system,
    messages: body.messages
  };

  // Add tools only if provided
  if (body.tools && body.tools.length > 0) {
    payload.tools = body.tools;
  }

  // Add beta header for prompt caching if cache_control present
  const useCaching = JSON.stringify(body).includes('cache_control');

  const data = JSON.stringify(payload);

  return new Promise((resolve) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(data)
    };

    if (useCaching) {
      headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
    }

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: responseData
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message })
      });
    });

    req.write(data);
    req.end();
  });
};
