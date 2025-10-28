# World Political Map - Next.js Project Plan

## Project Overview
Create a clean, minimalist political world map using Next.js with:
- Ocean: Blue background
- Countries: White fill with black borders
- Scalable SVG rendering
- Modern, responsive design

## Tech Stack Recommendations

### Core Technologies
- **Next.js 14+** (App Router)
- **React 18+**
- **react-simple-maps** - For map rendering
- **Tailwind CSS** - For styling

### Why react-simple-maps?
- Built on D3.js but much simpler API
- Perfect for static/semi-static maps
- Easy styling control
- Good performance with SVG
- Works seamlessly with React/Next.js

## Data Source

### Recommended: Natural Earth Data
- **URL**: https://www.naturalearthdata.com/
- **Dataset**: Admin 0 - Countries (Cultural)
- **Resolution**: 110m (simplified) or 50m (medium detail)
- **Format**: GeoJSON
- **License**: Public domain

### Direct Download Link
```
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
```

## Project Structure

```
world-map/
├── app/
│   ├── page.js              # Main page with map
│   ├── layout.js            # Root layout
│   └── globals.css          # Global styles
├── components/
│   └── WorldMap.jsx         # Map component
├── public/
│   └── world-countries.json # GeoJSON data
├── package.json
├── next.config.js
└── tailwind.config.js
```

## Setup Steps

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest world-map
cd world-map
```

**Options to select:**
- TypeScript? No (or Yes if you prefer)
- ESLint? Yes
- Tailwind CSS? Yes
- App Router? Yes
- Customize import alias? No

### 2. Install Dependencies
```bash
npm install react-simple-maps
```

### 3. Download GeoJSON Data
Download the Natural Earth countries dataset and save to `public/world-countries.json`

Option A: Manual download from Natural Earth website
Option B: Fetch directly in code (see implementation)

## Map Configuration

### Recommended Settings

**Projection**: Natural Earth projection
- Balanced look, good for world maps
- Alternative: Mercator (classic but distorts poles)

**Styling**:
- Ocean: `#4A90E2` or `#0077BE` (blue)
- Countries: `#FFFFFF` (white)
- Borders: `#000000` (black)
- Border width: `0.5` to `1px`

**Dimensions**:
- Aspect ratio: 2:1 (standard for world maps)
- Responsive width: 100% of container
- Height: auto-calculated

## Component Architecture

### WorldMap.jsx
Main map component that:
- Loads GeoJSON data
- Renders countries using react-simple-maps
- Handles styling
- Responsive container

### page.js
- Container for WorldMap
- Page layout and structure
- Optional: Title, description, controls

## Feature Roadmap

### Phase 1: Basic Map (Start Here)
- [ ] Set up Next.js project
- [ ] Install react-simple-maps
- [ ] Load GeoJSON data
- [ ] Render basic map
- [ ] Apply color scheme (blue ocean, white countries, black borders)
- [ ] Make responsive

### Phase 2: Enhancements (Optional)
- [ ] Hover effects (highlight countries on hover)
- [ ] Tooltips (show country name)
- [ ] Zoom and pan functionality
- [ ] Country selection/click events

### Phase 3: Advanced (Future)
- [ ] Data visualization layer (choropleth)
- [ ] Country search/filter
- [ ] Custom markers/pins
- [ ] Animation effects
- [ ] Export as image

## Implementation Notes

### Performance Tips
- Use 110m resolution GeoJSON for faster loading
- Implement lazy loading if adding heavy features
- Use SVG for sharp rendering at any size
- Consider memoization for large datasets

### Styling Strategy
- Use Tailwind for layout and page structure
- Use inline styles or CSS modules for SVG map styling
- Keep ocean as page/container background color
- Use stroke and fill props for countries

### Responsive Design
- Make map width 100% of container
- Use max-width for large screens
- Maintain aspect ratio with CSS
- Test on mobile devices

## Code Snippets Preview

### Basic WorldMap Component Structure
```jsx
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

export default function WorldMap() {
  return (
    <ComposableMap
      projection="geoNaturalEarth1"
      projectionConfig={{
        scale: 180
      }}
    >
      <Geographies geography="/world-countries.json">
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth={0.5}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
}
```

### Page with Blue Ocean Background
```jsx
export default function Home() {
  return (
    <main className="min-h-screen bg-[#4A90E2] flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <WorldMap />
      </div>
    </main>
  );
}
```

## Resources

- **react-simple-maps Docs**: https://www.react-simple-maps.io/
- **Natural Earth Data**: https://www.naturalearthdata.com/
- **D3 Projections**: https://github.com/d3/d3-geo-projection
- **GeoJSON Spec**: https://geojson.org/

## Next Steps

1. Create the Next.js project
2. Install dependencies
3. Download and add GeoJSON data
4. Create WorldMap component
5. Test and refine styling
6. Add interactivity (optional)

## Notes

- Start simple with Phase 1
- The map will be fully static HTML/SVG (great for SEO)
- Can deploy easily to Vercel
- GeoJSON file is ~1.5MB (110m) - acceptable for web
- No API keys or external services needed

---

**Ready to build!** This should give you a clean, professional world map as your starting point.
