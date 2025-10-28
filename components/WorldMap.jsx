"use client"

import { ComposableMap, Geographies, Geography } from "react-simple-maps"

export default function WorldMap() {
  return (
    <div className="w-full">
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
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
