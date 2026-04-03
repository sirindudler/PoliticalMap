/**
 * Generates public/regime-timeseries.json from a V-Dem CSV export.
 *
 * Output schema: { "AFG": { "2015": "Closed Autocracy", ..., "2024": "Closed Autocracy" }, ... }
 * Countries with fewer than 3 data points in the range are omitted (sparkline won't render).
 *
 * Usage:
 *   node scripts/process-vdem-timeseries.js [csv-path]
 *
 * If csv-path is omitted, looks for vdem-data.csv in the project root.
 * You can also run `npm run update:vdem` first to download the latest CSV.
 */

const fs = require('fs')
const path = require('path')

const START_YEAR = 2015
const END_YEAR = 2024
const MIN_DATA_POINTS = 3  // countries with fewer points are excluded

const REGIME_MAP = {
  '0': 'Closed Autocracy',
  '1': 'Electoral Autocracy',
  '2': 'Electoral Democracy',
  '3': 'Liberal Democracy',
}

const csvPath = process.argv[2] || path.join(__dirname, '../vdem-data.csv')

if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found at ${csvPath}`)
  console.error('Run `node scripts/fetch-vdem.js` first to download it,')
  console.error('or provide the path as an argument.')
  process.exit(1)
}

const lines = fs.readFileSync(csvPath, 'utf-8').split('\n')
const timeseries = {}  // { countryCode: { year: category } }

let headerSkipped = false
for (const line of lines) {
  if (!headerSkipped) { headerSkipped = true; continue }
  if (!line.trim()) continue

  const parts = line.split(',')
  if (parts.length < 4) continue

  const [_country, code, year, regime] = parts
  const yr = parseInt(year, 10)
  if (!code || !year || yr < START_YEAR || yr > END_YEAR) continue
  if (regime === undefined || regime.trim() === '') continue

  const category = REGIME_MAP[regime.trim()]
  if (!category) continue

  if (!timeseries[code]) timeseries[code] = {}
  timeseries[code][String(yr)] = category
}

// Filter countries with too few data points
const filtered = {}
for (const [code, years] of Object.entries(timeseries)) {
  if (Object.keys(years).length >= MIN_DATA_POINTS) {
    filtered[code] = years
  }
}

const outputPath = path.join(__dirname, '../public/regime-timeseries.json')
fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2))
console.log(`✓ Saved timeseries for ${Object.keys(filtered).length} countries (${START_YEAR}–${END_YEAR}) to ${outputPath}`)
