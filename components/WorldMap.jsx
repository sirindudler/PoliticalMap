"use client"

import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"

const DATASET_CONFIGS = {
  regime: {
    title: 'Political Regime (V-Dem)',
    file: '/regime-data.json',
    colors: {
      'Closed Autocracy': '#8B0000',
      'Electoral Autocracy': '#FF6B6B',
      'Electoral Democracy': '#90EE90',
      'Liberal Democracy': '#2E7D32',
      'No Data': '#CCCCCC',
    },
  },
  freedom: {
    title: 'Freedom Status (Freedom House)',
    file: '/freedom-house-data.json',
    colors: {
      'Free': '#2E7D32',
      'Partly Free': '#FFA726',
      'Not Free': '#8B0000',
      'No Data': '#CCCCCC',
    },
  },
  income: {
    title: 'Income Level (World Bank)',
    file: '/world-bank-income-data.json',
    colors: {
      'High Income': '#1976D2',
      'Upper Middle Income': '#4CAF50',
      'Lower Middle Income': '#FFA726',
      'Low Income': '#D32F2F',
      'No Data': '#CCCCCC',
    },
  },
}

function getIsoCode(geo) {
  return geo.properties.ISO_A3 === '-99'
    ? geo.properties.ISO_A3_EH
    : geo.properties.ISO_A3
}

export default function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState("")
  const [currentDataset, setCurrentDataset] = useState('regime')
  const [allData, setAllData] = useState({ regime: {}, freedom: {}, income: {} })
  const [loadErrors, setLoadErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1.2 })
  const [clickedCountry, setClickedCountry] = useState(null)
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 })
  const [wikiData, setWikiData] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  // Load all three datasets in parallel on mount
  useEffect(() => {
    const fetchJson = async (url, key) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return { key, data: await res.json() }
      } catch (err) {
        return { key, error: err.message }
      }
    }

    Promise.all([
      fetchJson('/regime-data.json', 'regime'),
      fetchJson('/freedom-house-data.json', 'freedom'),
      fetchJson('/world-bank-income-data.json', 'income'),
    ]).then(results => {
      const newData = { regime: {}, freedom: {}, income: {} }
      const errors = {}
      for (const result of results) {
        if (result.error) errors[result.key] = result.error
        else newData[result.key] = result.data
      }
      setAllData(newData)
      setLoadErrors(errors)
      setLoading(false)
    })
  }, [])

  const config = DATASET_CONFIGS[currentDataset]

  const getCountryColor = (isoCode) => {
    const category = allData[currentDataset][isoCode]
    return config.colors[category] || config.colors['No Data']
  }

  const getCountryCategory = (isoCode) => {
    return allData[currentDataset][isoCode] || 'No Data'
  }

  const handleZoom = (e) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    const newZoom = Math.min(Math.max(position.zoom + delta, 1.2), 8)
    setPosition(prev => ({ ...prev, zoom: newZoom }))
  }

  const handleMoveEnd = (newPosition) => {
    const minZoom = 1.2
    const zoom = newPosition.zoom
    if (zoom <= minZoom) {
      setPosition({ coordinates: [0, 0], zoom })
      return
    }
    const maxLng = (zoom - minZoom) * 100
    const maxLat = (zoom - minZoom) * 50
    let [lng, lat] = newPosition.coordinates
    lng = Math.max(-maxLng, Math.min(maxLng, lng))
    lat = Math.max(-maxLat, Math.min(maxLat, lat))
    setPosition({ coordinates: [lng, lat], zoom })
  }

  const handleCountryClick = (geo, event) => {
    event.stopPropagation()

    const isoCode = getIsoCode(geo)
    const countryName = geo.properties.NAME || geo.properties.ADMIN
    const category = getCountryCategory(isoCode)

    if (clickedCountry && clickedCountry.name === countryName) {
      setClickedCountry(null)
      setWikiData(null)
      return
    }

    setClickedCountry({ name: countryName, category })
    setLabelPosition({ x: event.clientX, y: event.clientY })
    setWikiData(null)
    setWikiLoading(true)

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`)
      .then(res => res.json())
      .then(data => {
        setWikiData({
          extract: data.extract,
          thumbnail: data.thumbnail?.source,
        })
        setWikiLoading(false)
      })
      .catch(() => setWikiLoading(false))
  }

  const handleMapClick = () => {
    setClickedCountry(null)
    setWikiData(null)
  }

  const hasErrors = Object.keys(loadErrors).length > 0

  return (
    <div className="relative w-full h-full" onWheel={handleZoom}>
      {/* Error banner */}
      {hasErrors && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-red-600 text-white text-xs px-4 py-2">
          Failed to load: {Object.keys(loadErrors).join(', ')} — refresh to retry
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#4A90E2]/80">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-sm font-medium text-gray-700">
            Loading map data...
          </div>
        </div>
      )}

      <ComposableMap
        width={800}
        height={600}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 180 }}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography="/world-countries.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoCode = getIsoCode(geo)
                const countryName = geo.properties.NAME || geo.properties.ADMIN
                const category = getCountryCategory(isoCode)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(isoCode)}
                    stroke="#000000"
                    strokeWidth={0.5}
                    onClick={(event) => handleCountryClick(geo, event)}
                    onMouseEnter={() => {
                      setTooltipContent(`${countryName} - ${category}`)
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("")
                    }}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#F0F0F0', outline: 'none', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover Tooltip */}
      {tooltipContent && !clickedCountry && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-10
                        text-sm font-medium whitespace-nowrap pointer-events-none">
          {tooltipContent}
        </div>
      )}

      {/* Wikipedia Country Info Popup */}
      {clickedCountry && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-72"
          style={{
            left: `${Math.min(labelPosition.x + 16, window.innerWidth - 304)}px`,
            top: `${Math.min(labelPosition.y + 16, window.innerHeight - 320)}px`,
          }}
        >
          {wikiData?.thumbnail && (
            <img
              src={wikiData.thumbnail}
              alt={`${clickedCountry.name}`}
              className="w-full h-32 object-cover rounded-t-xl"
            />
          )}
          {wikiLoading && (
            <div className="w-full h-32 bg-gray-100 rounded-t-xl flex items-center justify-center">
              <div className="text-gray-400 text-xs">Loading...</div>
            </div>
          )}

          <div className="p-4">
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full w-6 h-6
                         flex items-center justify-center text-gray-600 hover:text-black
                         shadow text-xs font-bold"
              onClick={() => { setClickedCountry(null); setWikiData(null) }}
            >
              ✕
            </button>

            <div className="font-bold text-base mb-1">{clickedCountry.name}</div>
            <div
              className="text-xs font-medium text-white rounded px-2 py-0.5 inline-block mb-3"
              style={{ backgroundColor: config.colors[clickedCountry.category] || '#999' }}
            >
              {clickedCountry.category}
            </div>

            {wikiData?.extract && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {wikiData.extract}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dataset Toggle */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <h3 className="font-bold mb-2 text-xs text-gray-600">VIEW BY:</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(DATASET_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setCurrentDataset(key)}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                currentDataset === key
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cfg.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
        <h3 className="font-bold mb-3 text-sm">{config.title}</h3>
        {Object.entries(config.colors)
          .filter(([type]) => type !== 'No Data')
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: color }} />
              <span className="text-xs">{type}</span>
            </div>
          ))}
        <div className="flex items-center gap-2 mb-0 mt-3 pt-2 border-t border-gray-200">
          <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: config.colors['No Data'] }} />
          <span className="text-xs text-gray-600">No Data</span>
        </div>
      </div>
    </div>
  )
}
