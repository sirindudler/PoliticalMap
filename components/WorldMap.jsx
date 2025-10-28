"use client"

import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const regimeColors = {
  'Closed Autocracy': '#8B0000',      // Dark Red
  'Electoral Autocracy': '#FF6B6B',   // Light Red/Coral
  'Electoral Democracy': '#4ECDC4',   // Teal
  'Liberal Democracy': '#45B7D1',     // Blue
  'No Data': '#CCCCCC'                // Gray
}

export default function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState("")
  const [regimeData, setRegimeData] = useState({})

  useEffect(() => {
    // Load regime classification data
    fetch('/regime-data.json')
      .then(res => res.json())
      .then(data => setRegimeData(data))
      .catch(err => console.error('Error loading regime data:', err))
  }, [])

  const getCountryColor = (isoCode) => {
    const regime = regimeData[isoCode]
    return regimeColors[regime] || regimeColors['No Data']
  }

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 180
        }}
      >
        <Geographies geography="/world-countries.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const isoCode = geo.properties.ISO_A3
              const countryName = geo.properties.NAME || geo.properties.ADMIN
              const regime = regimeData[isoCode] || 'No Data'

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(isoCode)}
                  stroke="#000000"
                  strokeWidth={0.5}
                  onMouseEnter={() => {
                    setTooltipContent(`${countryName} - ${regime}`)
                  }}
                  onMouseLeave={() => {
                    setTooltipContent("")
                  }}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#F0F0F0',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' }
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-10
                        text-sm font-medium whitespace-nowrap">
          {tooltipContent}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <h3 className="font-bold mb-3 text-sm">Regime Types (2024)</h3>
        {Object.entries(regimeColors).filter(([type]) => type !== 'No Data').map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mb-0 mt-3 pt-2 border-t border-gray-200">
          <div
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: regimeColors['No Data'] }}
          />
          <span className="text-xs text-gray-600">No Data</span>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
          Data: V-Dem Institute
        </div>
      </div>
    </div>
  )
}
