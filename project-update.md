# World Political Map - Feature Update Plan

## New Features to Add

### 1. Display Country Names on Hover
### 2. Color Countries by Government Type

---

## Feature 1: Country Names on Hover

### Good News!
Country names are **already included** in the Natural Earth GeoJSON data. Each country feature has properties including:
- `NAME` or `ADMIN` - Full country name
- `ISO_A3` - 3-letter country code
- `ISO_A2` - 2-letter country code

### Implementation

**Simple approach using react-simple-maps:**

```jsx
<Geography
  key={geo.rsmKey}
  geography={geo}
  fill="#FFFFFF"
  stroke="#000000"
  strokeWidth={0.5}
  onMouseEnter={() => {
    const { NAME } = geo.properties;
    setTooltipContent(NAME);
  }}
  onMouseLeave={() => {
    setTooltipContent("");
  }}
  style={{
    hover: {
      fill: "#E8E8E8",
      cursor: "pointer"
    }
  }}
/>
```

**Add a tooltip component:**
- Use `react-tooltip` package OR
- Create custom tooltip with absolute positioning
- Display on hover with country name

---

## Feature 2: Color by Government Type

### Recommended Data Source: V-Dem "Regimes of the World" (RoW)

**Why V-Dem RoW?**
- Most authoritative and widely-used democracy dataset
- Covers 202 countries from 1900-2024
- Free and open access
- Clear 4-category classification
- Updated annually

### The Four Regime Types

The Regimes of the World classification distinguishes between four types of political systems:

1. **Closed Autocracy** - Citizens cannot choose either the chief executive or the legislature through multi-party elections
2. **Electoral Autocracy** - Citizens can choose leaders through multi-party elections, but lack freedoms that make elections meaningful, free, and fair
3. **Electoral Democracy** - Citizens can participate in meaningful, free and fair, and multi-party elections
4. **Liberal Democracy** - Electoral democracy plus individual and minority rights, equality before the law, and constrained executive actions

### Suggested Color Scheme

Based on common conventions in political science visualizations:

```javascript
const regimeColors = {
  'Closed Autocracy': '#8B0000',      // Dark Red
  'Electoral Autocracy': '#FF6B6B',   // Light Red/Coral
  'Electoral Democracy': '#4ECDC4',   // Teal
  'Liberal Democracy': '#45B7D1',     // Blue
  'No Data': '#CCCCCC'                // Gray
};
```

**Alternative color schemes:**
- **Traffic light**: Red → Yellow → Light Green → Dark Green
- **Monochrome**: Dark Gray → Light Gray → Light Blue → Dark Blue
- **Heat map**: Dark Red → Orange → Yellow → Light Blue

---

## Data Acquisition

### Option A: Download V-Dem Dataset (Recommended)

**Direct download from V-Dem:**
1. Visit: https://www.v-dem.net/data/the-v-dem-dataset/
2. Download: "Country-Year: V-Dem Core" version 15
3. Format: CSV file (~50MB)
4. Key columns needed:
   - `country_name` - Country name
   - `year` - Year
   - `v2x_regime` - Regime classification (0-3)
     - 0 = Closed Autocracy
     - 1 = Electoral Autocracy
     - 2 = Electoral Democracy
     - 3 = Liberal Democracy

**Processing steps:**
1. Filter for year 2024 (or most recent year available)
2. Extract only: country_name, v2x_regime
3. Convert to JSON format for web use
4. Save as `regime-data.json`

### Option B: Use Our World in Data

**Alternative source with cleaner data:**
- URL: https://ourworldindata.org/grapher/political-regime
- Click "Download" button
- Get CSV with country, year, regime type
- Already cleaned and formatted

### Option C: Create Manual JSON (Quick Start)

For rapid prototyping, create a simplified JSON file with ~50 major countries:

```json
{
  "United States": "Liberal Democracy",
  "China": "Closed Autocracy",
  "Russia": "Electoral Autocracy",
  "India": "Electoral Democracy",
  "Germany": "Liberal Democracy",
  ...
}
```

---

## Data Matching Strategy

### Challenge: Country Name Variations

Natural Earth and V-Dem may use different country names:
- "United States" vs "United States of America"
- "Russia" vs "Russian Federation"
- "South Korea" vs "Republic of Korea"

### Solution: Use ISO Codes

**Best practice:**
1. Natural Earth has `ISO_A3` codes (e.g., "USA", "CHN", "RUS")
2. Add ISO codes to V-Dem data or create a lookup table
3. Match by ISO code instead of country name

**Lookup table example:**
```json
{
  "USA": "Liberal Democracy",
  "CHN": "Closed Autocracy",
  "RUS": "Electoral Autocracy",
  "IND": "Electoral Democracy"
}
```

---

## Implementation Plan

### Phase 1: Add Hover Tooltips (Simple)

**Files to modify:**
- `components/WorldMap.jsx`

**Steps:**
1. Add state for tooltip content: `const [tooltipContent, setTooltipContent] = useState("")`
2. Add hover handlers to Geography component
3. Add tooltip display component
4. Style hover effect (lighter color, cursor pointer)

**Estimated time:** 30 minutes

### Phase 2: Add Regime Type Colors (More Complex)

**Files to create/modify:**
- `public/regime-data.json` - Regime classifications
- `components/WorldMap.jsx` - Map component
- `utils/regimeColors.js` - Color mappings (optional)

**Steps:**

1. **Prepare Data**
   - Download V-Dem dataset
   - Extract 2024 data
   - Create JSON with ISO_A3 codes and regime types
   - Save to `public/regime-data.json`

2. **Load Data in Component**
   ```jsx
   const [regimeData, setRegimeData] = useState({});
   
   useEffect(() => {
     fetch('/regime-data.json')
       .then(res => res.json())
       .then(data => setRegimeData(data));
   }, []);
   ```

3. **Create Color Mapping Function**
   ```jsx
   const getCountryColor = (isoCode) => {
     const regime = regimeData[isoCode];
     return regimeColors[regime] || regimeColors['No Data'];
   };
   ```

4. **Update Geography Component**
   ```jsx
   <Geography
     key={geo.rsmKey}
     geography={geo}
     fill={getCountryColor(geo.properties.ISO_A3)}
     stroke="#000000"
     strokeWidth={0.5}
   />
   ```

5. **Add Legend**
   - Create a legend component showing color meanings
   - Position in corner of map
   - List all 4 regime types with colors

**Estimated time:** 2-3 hours

### Phase 3: Enhanced Features (Optional)

- **Year selector**: Allow users to see regime changes over time
- **Transition animations**: Animate color changes when year changes
- **Click for details**: Show more info about country's regime
- **Search functionality**: Search and highlight specific countries
- **Statistics panel**: Show counts of each regime type

---

## Technical Implementation Details

### Complete WorldMap Component Structure

```jsx
import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const regimeColors = {
  'Closed Autocracy': '#8B0000',
  'Electoral Autocracy': '#FF6B6B',
  'Electoral Democracy': '#4ECDC4',
  'Liberal Democracy': '#45B7D1',
  'No Data': '#CCCCCC'
};

export default function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState("");
  const [regimeData, setRegimeData] = useState({});

  useEffect(() => {
    // Load regime classification data
    fetch('/regime-data.json')
      .then(res => res.json())
      .then(data => setRegimeData(data));
  }, []);

  const getCountryColor = (isoCode) => {
    const regime = regimeData[isoCode];
    return regimeColors[regime] || regimeColors['No Data'];
  };

  return (
    <div className="relative">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 180 }}
      >
        <Geographies geography="/world-countries.json">
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getCountryColor(geo.properties.ISO_A3)}
                stroke="#000000"
                strokeWidth={0.5}
                onMouseEnter={() => {
                  const { NAME } = geo.properties;
                  const regime = regimeData[geo.properties.ISO_A3] || 'No Data';
                  setTooltipContent(`${NAME} - ${regime}`);
                }}
                onMouseLeave={() => {
                  setTooltipContent("");
                }}
                style={{
                  default: { outline: "none" },
                  hover: {
                    fill: "#F0F0F0",
                    outline: "none",
                    cursor: "pointer"
                  },
                  pressed: { outline: "none" }
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      
      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-200">
          {tooltipContent}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded shadow-lg">
        <h3 className="font-bold mb-2">Regime Types</h3>
        {Object.entries(regimeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-1">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: color }}
            />
            <span className="text-sm">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Data Processing Script

### Python script to process V-Dem data

```python
import pandas as pd
import json

# Load V-Dem CSV
df = pd.read_csv('V-Dem-CY-Full-v15.csv')

# Filter for 2024 (or most recent year)
df_2024 = df[df['year'] == 2024]

# Map regime codes to names
regime_map = {
    0: 'Closed Autocracy',
    1: 'Electoral Autocracy',
    2: 'Electoral Democracy',
    3: 'Liberal Democracy'
}

# Create lookup by ISO code
# Note: You'll need to add ISO_A3 codes - V-Dem uses country_text_id
# You may need a separate lookup table to map V-Dem countries to ISO codes

regime_dict = {}
for _, row in df_2024.iterrows():
    iso_code = row['COWcode']  # or use a mapping
    regime_code = row['v2x_regime']
    if pd.notna(regime_code):
        regime_dict[iso_code] = regime_map[int(regime_code)]

# Save as JSON
with open('regime-data.json', 'w') as f:
    json.dump(regime_dict, f, indent=2)
```

---

## Alternative: Simplified Manual Approach

### Quick JSON File (Top 50 Countries)

For rapid development, create a simplified `public/regime-data.json`:

```json
{
  "USA": "Liberal Democracy",
  "CAN": "Liberal Democracy",
  "MEX": "Electoral Democracy",
  "BRA": "Electoral Democracy",
  "ARG": "Electoral Democracy",
  "GBR": "Liberal Democracy",
  "FRA": "Liberal Democracy",
  "DEU": "Liberal Democracy",
  "ITA": "Liberal Democracy",
  "ESP": "Liberal Democracy",
  "POL": "Electoral Democracy",
  "UKR": "Electoral Democracy",
  "RUS": "Electoral Autocracy",
  "TUR": "Electoral Autocracy",
  "CHN": "Closed Autocracy",
  "JPN": "Liberal Democracy",
  "KOR": "Liberal Democracy",
  "IND": "Electoral Democracy",
  "PAK": "Electoral Autocracy",
  "BGD": "Electoral Autocracy",
  "IDN": "Electoral Democracy",
  "PHL": "Electoral Democracy",
  "VNM": "Closed Autocracy",
  "THA": "Electoral Autocracy",
  "MYS": "Electoral Autocracy",
  "AUS": "Liberal Democracy",
  "NZL": "Liberal Democracy",
  "ZAF": "Electoral Democracy",
  "EGY": "Electoral Autocracy",
  "SAU": "Closed Autocracy",
  "IRN": "Electoral Autocracy",
  "IRQ": "Electoral Autocracy",
  "ISR": "Electoral Democracy",
  "NGA": "Electoral Democracy",
  "KEN": "Electoral Democracy",
  "ETH": "Electoral Autocracy"
}
```

Gradually expand this as needed.

---

## Resources & References

### V-Dem Documentation
- **Main site**: https://www.v-dem.net/
- **Dataset download**: https://www.v-dem.net/data/the-v-dem-dataset/
- **Codebook**: Available in download (explains all variables)
- **Methodology**: https://ourworldindata.org/regimes-of-the-world-data

### Natural Earth Data
- **Countries GeoJSON**: https://github.com/nvkelso/natural-earth-vector
- **Properties**: NAME, ISO_A3, ISO_A2, ADMIN

### Alternative Data Sources
- **Freedom House**: https://freedomhouse.org/report/freedom-world (Free/Partly Free/Not Free)
- **Economist Democracy Index**: https://www.eiu.com/n/campaigns/democracy-index/ (4 categories)
- **Polity Project**: https://www.systemicpeace.org/polityproject.html (Autocracy/Anocracy/Democracy)

### React Libraries
- **react-tooltip**: `npm install react-tooltip` - For better tooltips
- **react-simple-maps**: Already included

---

## Testing Checklist

### Hover Functionality
- [ ] Tooltip appears on mouse enter
- [ ] Tooltip disappears on mouse leave
- [ ] Tooltip shows correct country name
- [ ] Hover color change works
- [ ] Tooltip positioned correctly
- [ ] Works on mobile (touch events)

### Color Coding
- [ ] All countries with data are colored correctly
- [ ] Legend displays all regime types
- [ ] Legend colors match map colors
- [ ] Countries without data show as gray
- [ ] Colors are distinguishable
- [ ] Color scheme is accessible (color-blind friendly)

### Performance
- [ ] Map loads quickly
- [ ] Hover is responsive (no lag)
- [ ] Data loads without blocking render
- [ ] Works smoothly with 200+ countries

---

## Next Steps

1. **Immediate**: Add hover tooltips (30 min)
2. **Short-term**: Download V-Dem data and create regime-data.json (1-2 hours)
3. **Medium-term**: Implement color coding with legend (2-3 hours)
4. **Long-term**: Add year selector and transitions (4-6 hours)

---

## Summary

**Feature 1 (Country Names)**: Easy! Names are already in the GeoJSON. Just add hover handlers and tooltip display.

**Feature 2 (Government Types)**: 
- Use V-Dem "Regimes of the World" classification (authoritative, free, comprehensive)
- 4 categories: Closed Autocracy → Electoral Autocracy → Electoral Democracy → Liberal Democracy
- Match countries by ISO codes
- Color code the map
- Add a legend

**Total implementation time**: 3-4 hours for both features (excluding data preparation)

This will give you a powerful, informative political map that's both educational and visually compelling!
