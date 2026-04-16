const https = require('https');

function testUrl(version) {
  const url = `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(url, '=>', res.statusCode, data.substring(0, 50).replace(/\n/g, ' ')));
  });
}

for (let i = 18; i <= 25; i++) {
  testUrl(`v${i}`);
}
