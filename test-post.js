const https = require('https');

function testUrl(method) {
  const req = https.request('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
    method: method,
    headers: {
      'Authorization': 'Bearer INVALID',
      'developer-token': 'INVALID'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(method, '=>', res.statusCode, data.substring(0, 50).replace(/\n/g, ' ')));
  });
  req.on('error', console.error);
  req.end();
}

testUrl('GET');
testUrl('POST');
