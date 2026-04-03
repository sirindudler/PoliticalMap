/**
 * Downloads and processes the latest V-Dem "Regimes of the World" dataset.
 *
 * Generates two files in one pass:
 *   public/regime-data.json        — current year (used for map colors)
 *   public/regime-timeseries.json  — 10-year history per country (used for sparklines)
 *
 * V-Dem releases data annually (usually Feb/March).
 * Latest releases: https://v-dem.net/data/the-v-dem-dataset/
 *
 * Run with: node scripts/fetch-vdem.js
 * Override URL:  VDEM_URL=https://... node scripts/fetch-vdem.js
 * Override year: VDEM_YEAR=2023 node scripts/fetch-vdem.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VDEM_URL = process.env.VDEM_URL ||
  'https://v-dem.net/media/datasets/V-Dem-CY-FullOthers-v15_csv.zip';

const CURRENT_YEAR = process.env.VDEM_YEAR || '2024';
const TIMESERIES_START = parseInt(CURRENT_YEAR) - 9;  // 10 years including current
const MIN_TS_POINTS = 3;

const REGIME_MAP = {
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

  const tmpZip = path.join(__dirname, '../_vdem_tmp.csv.zip');
  fs.writeFileSync(tmpZip, zipBuffer);

  const { execSync } = require('child_process');
  const tmpDir = path.join(__dirname, '../_vdem_tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`unzip -o "${tmpZip}" -d "${tmpDir}"`);

  const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.csv'));
  if (!files.length) throw new Error('No CSV found in zip');

  const csvPath = path.join(tmpDir, files[0]);
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');

  // Detect column indices from header (handles quoted and unquoted headers)
  const header = lines[0].split(',').map(c => c.replace(/"/g, '').trim());
  const codeIdx   = header.indexOf('country_text_id');
  const yearIdx   = header.indexOf('year');
  const regimeIdx = header.indexOf('v2x_regime');
  const boixIdx   = header.indexOf('e_boix_regime');  // fallback: 0=autocracy, 1=democracy

  if (codeIdx === -1 || yearIdx === -1 || regimeIdx === -1) {
    throw new Error(`Could not find required columns. Found: code=${codeIdx}, year=${yearIdx}, regime=${regimeIdx}`);
  }
  console.log(`Columns: code=${codeIdx}, year=${yearIdx}, regime=${regimeIdx}, boix=${boixIdx}`);

  // Boix fallback: maps 0→Closed Autocracy, 1→Electoral Democracy
  // Used when v2x_regime is missing (V-Dem expert survey incomplete for that country-year)
  const BOIX_MAP = { '0': 'Closed Autocracy', '1': 'Electoral Democracy' };

  const regimeData = {};       // { ISO: category } for current year
  const timeseries = {};       // { ISO: { year: category } } for 10-year window

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length <= regimeIdx) continue;

    const code   = parts[codeIdx].replace(/"/g, '').trim();
    const year   = parts[yearIdx].replace(/"/g, '').trim();
    const regime = parts[regimeIdx].replace(/"/g, '').trim();
    const boix   = boixIdx !== -1 ? parts[boixIdx]?.replace(/"/g, '').trim() : '';

    if (!code || !year) continue;

    // Prefer v2x_regime; fall back to Boix-Miller-Rosato when missing
    const category = REGIME_MAP[regime] || (BOIX_MAP[boix] ?? null);
    if (!category) continue;

    const yr = parseInt(year, 10);

    // Current year → regime-data.json
    if (year === CURRENT_YEAR) {
      regimeData[code] = category;
    }

    // 10-year window → regime-timeseries.json
    if (yr >= TIMESERIES_START && yr <= parseInt(CURRENT_YEAR)) {
      if (!timeseries[code]) timeseries[code] = {};
      timeseries[code][year] = category;
    }
  }

  // Filter timeseries: only countries with enough data points
  const filteredTimeseries = {};
  for (const [code, years] of Object.entries(timeseries)) {
    if (Object.keys(years).length >= MIN_TS_POINTS) {
      filteredTimeseries[code] = years;
    }
  }

  const publicDir = path.join(__dirname, '../public');
  fs.writeFileSync(
    path.join(publicDir, 'regime-data.json'),
    JSON.stringify(regimeData, null, 2)
  );
  console.log(`✓ regime-data.json: ${Object.keys(regimeData).length} countries (${CURRENT_YEAR})`);

  fs.writeFileSync(
    path.join(publicDir, 'regime-timeseries.json'),
    JSON.stringify(filteredTimeseries, null, 2)
  );
  console.log(`✓ regime-timeseries.json: ${Object.keys(filteredTimeseries).length} countries (${TIMESERIES_START}–${CURRENT_YEAR})`);

  // Cleanup
  fs.rmSync(tmpZip, { force: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(err => { console.error(err); process.exit(1); });
