/**
 * Fetches World Bank income classification data directly from the World Bank API.
 * No local Excel file needed. Run with: node scripts/fetch-worldbank.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse JSON: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching World Bank income data...');

  // World Bank API returns paginated results; per_page=500 covers all countries
  const url = 'https://api.worldbank.org/v2/country/all?format=json&per_page=500';
  const response = await fetchJSON(url);

  if (!response[1]) {
    throw new Error('Unexpected API response structure');
  }

  const incomeMap = {
    'High income':          'High Income',
    'Upper middle income':  'Upper Middle Income',
    'Lower middle income':  'Lower Middle Income',
    'Low income':           'Low Income',
  };

  const incomeData = {};
  for (const country of response[1]) {
    const code = country.id;           // ISO3 code
    const group = country.incomeLevel?.value;
    if (code && group && incomeMap[group]) {
      incomeData[code] = incomeMap[group];
    }
  }

  const outputPath = path.join(__dirname, '../public/world-bank-income-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(incomeData, null, 2));
  console.log(`✓ Saved ${Object.keys(incomeData).length} countries to ${outputPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
