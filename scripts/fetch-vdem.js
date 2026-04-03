/**
 * Downloads and processes the latest V-Dem "Regimes of the World" dataset.
 *
 * V-Dem releases data annually (usually Feb/March).
 * Update VDEM_URL below when a new version is released.
 * Latest releases: https://v-dem.net/data/the-v-dem-dataset/
 *
 * Run with: node scripts/fetch-vdem.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// Update this URL each year when V-Dem releases a new version
const VDEM_URL = process.env.VDEM_URL ||
  'https://v-dem.net/media/datasets/V-Dem-CY-FullOthers-v14_1.csv.zip';

const YEAR = process.env.VDEM_YEAR || '2024';

const regimeMap = {
  '0': 'Closed Autocracy',
  '1': 'Electoral Autocracy',
  '2': 'Electoral Democracy',
  '3': 'Liberal Democracy',
};

function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PoliticalMap-updater/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadToBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  console.log(`Downloading V-Dem data from ${VDEM_URL}...`);
  const zipBuffer = await downloadToBuffer(VDEM_URL);

  // Decompress zip in-memory using zlib (works for single-file zips via raw deflate)
  // For multi-file zips we write to disk first
  const tmpZip = path.join(__dirname, '../_vdem_tmp.csv.zip');
  fs.writeFileSync(tmpZip, zipBuffer);

  // Use the system unzip command to extract the CSV
  const { execSync } = require('child_process');
  const tmpDir = path.join(__dirname, '../_vdem_tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`unzip -o "${tmpZip}" -d "${tmpDir}"`);

  const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.csv'));
  if (!files.length) throw new Error('No CSV found in zip');

  const csvPath = path.join(tmpDir, files[0]);
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');

  const regimeData = {};
  let headerProcessed = false;

  for (const line of lines) {
    if (!headerProcessed) { headerProcessed = true; continue; }
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const [country, code, year, regime] = parts;
    if (year === YEAR && code && regime !== undefined && regime !== '') {
      regimeData[code] = regimeMap[regime.trim()] || 'No Data';
    }
  }

  const outputPath = path.join(__dirname, '../public/regime-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(regimeData, null, 2));
  console.log(`✓ Saved ${Object.keys(regimeData).length} countries (${YEAR}) to ${outputPath}`);

  // Cleanup
  fs.rmSync(tmpZip, { force: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(err => { console.error(err); process.exit(1); });
