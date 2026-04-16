const https = require('https');

https.get('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
  headers: {
    'Authorization': 'Bearer INVALID_TOKEN',
    'developer-token': 'INVALID_TOKEN'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', data.substring(0, 300)));
});
