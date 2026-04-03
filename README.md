# PoliticalMap

An interactive world map for exploring political and economic data by country. Switch between three global datasets — political regime, freedom status, and income level — with hover tooltips, clickable country labels, and smooth zoom/pan.

![PoliticalMap screenshot](https://via.placeholder.com/1200x600?text=PoliticalMap+Screenshot)

## Features

- **Three dataset views** — toggle between Political Regime (V-Dem), Freedom Status (Freedom House), and Income Level (World Bank)
- **Hover tooltips** — see country name and current classification instantly
- **Click to label** — click any country to pin a label; click again to dismiss
- **Zoom & pan** — scroll to zoom in, drag to pan; minimum zoom prevents over-zooming
- **Color-coded legend** — always visible, updates with the active dataset
- **Responsive** — fills the browser window at any screen size

## Datasets

| Dataset | Source | Categories |
|---|---|---|
| Political Regime | [V-Dem Institute](https://www.v-dem.net/) | Closed Autocracy, Electoral Autocracy, Electoral Democracy, Liberal Democracy |
| Freedom Status | [Freedom House](https://freedomhouse.org/) | Free, Partly Free, Not Free |
| Income Level | [World Bank](https://datahelpdesk.worldbank.org/knowledgebase/articles/906519) | High, Upper Middle, Lower Middle, Low |

All datasets use 2024 classifications.

## Tech Stack

- [Next.js 15](https://nextjs.org/) + React 18
- [react-simple-maps](https://www.react-simple-maps.io/) for map rendering (D3 / geoNaturalEarth1 projection)
- [Tailwind CSS](https://tailwindcss.com/)
- GeoJSON from [Natural Earth](https://www.naturalearthdata.com/)

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/your-username/PoliticalMap-1.git
cd PoliticalMap-1
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Project Structure

```
app/
  page.js                    # Home page
  layout.js                  # Root layout & metadata
  globals.css                # Global styles
components/
  WorldMap.jsx               # Main interactive map component
public/
  world-countries.json       # Country geometries (GeoJSON, Natural Earth 110m)
  regime-data.json           # V-Dem regime classifications
  freedom-house-data.json    # Freedom House freedom status
  world-bank-income-data.json# World Bank income classifications
scripts/
  process-vdem-data.js       # Converts V-Dem CSV → regime-data.json
  process-freedom-house.js   # Converts Freedom House Excel → JSON
  process-worldbank-income.js# Converts World Bank Excel → JSON
```

## Regenerating Data

The processed JSON files are committed to the repo. If you want to update the data from new source files:

1. Place the raw files in the project root:
   - `vdem-data.csv` (V-Dem export)
   - `freedom-house-2024.xlsx`
   - `world-bank-income.xlsx`

2. Run the processing scripts:

```bash
node scripts/process-vdem-data.js
node scripts/process-freedom-house.js
node scripts/process-worldbank-income.js
```

## License

MIT
