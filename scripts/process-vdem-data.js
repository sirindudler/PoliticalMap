const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvContent = fs.readFileSync(path.join(__dirname, '../public/vdem-raw-data.csv'), 'utf-8');
const lines = csvContent.split('\n');

// Map regime codes to names
const regimeMap = {
  '0': 'Closed Autocracy',
  '1': 'Electoral Autocracy',
  '2': 'Electoral Democracy',
  '3': 'Liberal Democracy'
};

// Process CSV data
const regimeData = {};
let headerProcessed = false;

for (const line of lines) {
  if (!headerProcessed) {
    headerProcessed = true;
    continue; // Skip header
  }

  if (!line.trim()) continue;

  const parts = line.split(',');
  if (parts.length < 4) continue;

  const country = parts[0];
  const code = parts[1];
  const year = parts[2];
  const regime = parts[3];

  // Only keep 2024 data
  if (year === '2024' && code && regime !== undefined && regime !== '') {
    regimeData[code] = regimeMap[regime] || 'No Data';
  }
}

// Save to JSON
const outputPath = path.join(__dirname, '../public/regime-data.json');
fs.writeFileSync(outputPath, JSON.stringify(regimeData, null, 2));

console.log(`Processed ${Object.keys(regimeData).length} countries for 2024`);
console.log('Output saved to:', outputPath);

// Show sample of data
const sampleCodes = ['USA', 'CHN', 'RUS', 'IND', 'GBR', 'FRA', 'DEU'];
console.log('\nSample data:');
sampleCodes.forEach(code => {
  if (regimeData[code]) {
    console.log(`  ${code}: ${regimeData[code]}`);
  }
});
