"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import DataSourcesModal from './DataSourcesModal'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

const DATASET_CONFIGS = {
  regime: {
    title: 'Political Regime (V-Dem)',
    file: `${BASE}/regime-data.json`,
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
    file: `${BASE}/freedom-house-data.json`,
    colors: {
      'Free': '#2E7D32',
      'Partly Free': '#FFA726',
      'Not Free': '#8B0000',
      'No Data': '#CCCCCC',
    },
  },
  income: {
    title: 'Income Level (World Bank)',
    file: `${BASE}/world-bank-income-data.json`,
    colors: {
      'High Income': '#1976D2',
      'Upper Middle Income': '#4CAF50',
      'Lower Middle Income': '#FFA726',
      'Low Income': '#D32F2F',
      'No Data': '#CCCCCC',
    },
  },
}

const DATASET_LABELS = {
  regime: 'Regime',
  freedom: 'Freedom',
  income: 'Income',
}

const REGIME_ORDER = ['Closed Autocracy', 'Electoral Autocracy', 'Electoral Democracy', 'Liberal Democracy']
const REGIME_COLORS = DATASET_CONFIGS.regime.colors

function RegimeHistory({ isoCode, timeseries }) {
  const data = timeseries[isoCode]
  if (!data) return null

  const years = Object.keys(data).sort()
  const W = 240
  const H = 48
  const barW = Math.floor((W - (years.length - 1) * 2) / years.length)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-500 mb-2">
        Regime History ({years[0]}–{years[years.length - 1]})
      </div>
      <svg width={W} height={H + 14} className="block overflow-visible">
        {years.map((yr, i) => {
          const cat = data[yr]
          const fill = REGIME_COLORS[cat] || REGIME_COLORS['No Data']
          const rank = REGIME_ORDER.indexOf(cat)
          const barH = rank === -1 ? 8 : 12 + rank * 9
          const x = i * (barW + 2)
          return (
            <g key={yr}>
              <rect x={x} y={H - barH} width={barW} height={barH} fill={fill} rx={2}>
                <title>{yr}: {cat}</title>
              </rect>
              {i % 2 === 0 && (
                <text x={x + barW / 2} y={H + 11} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                  {yr}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {REGIME_ORDER.map(cat => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: REGIME_COLORS[cat] }} />
            <span className="text-[10px] text-gray-500">{cat.replace('Electoral ', 'El. ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
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
  const [timeseries, setTimeseries] = useState({})
  const [clickedCountry, setClickedCountry] = useState(null)  // { name, isoCode }
  const [popupDataset, setPopupDataset] = useState('regime')
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 })
  const [wikiData, setWikiData] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const countriesRef = useRef([])
  const countriesBuilt = useRef(false)

  const [mapPosition, setMapPosition] = useState({ coordinates: [0, 20], zoom: 1 })
  const dragDistRef = useRef(0)

  const MIN_ZOOM = 1

  const zoomAt = useCallback((factor) => {
    setMapPosition(pos => ({
      ...pos,
      zoom: Math.min(Math.max(pos.zoom * factor, MIN_ZOOM), 12),
    }))
  }, [])

  const handleMoveEnd = useCallback((pos) => {
    const zoom = Math.max(pos.zoom, MIN_ZOOM)
    const maxLng = 180 * (1 - 1 / zoom)
    const maxLat = 80 * (1 - 1 / zoom)
    const lng = Math.max(-maxLng, Math.min(maxLng, pos.coordinates[0]))
    const lat = Math.max(-maxLat, Math.min(maxLat, pos.coordinates[1]))
    setMapPosition({ zoom, coordinates: [lng, lat] })
  }, [])

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
      fetchJson(`${BASE}/regime-data.json`, 'regime'),
      fetchJson(`${BASE}/freedom-house-data.json`, 'freedom'),
      fetchJson(`${BASE}/world-bank-income-data.json`, 'income'),
      fetchJson(`${BASE}/regime-timeseries.json`, 'timeseries'),
    ]).then(results => {
      const newData = { regime: {}, freedom: {}, income: {} }
      const errors = {}
      for (const result of results) {
        if (result.key === 'timeseries') {
          if (!result.error) setTimeseries(result.data)
        } else if (result.error) {
          errors[result.key] = result.error
        } else {
          newData[result.key] = result.data
        }
      }
      setAllData(newData)
      setLoadErrors(errors)
      setLoading(false)
    })
  }, [])

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const config = DATASET_CONFIGS[currentDataset]

  const getCountryColor = (isoCode) => {
    const category = allData[currentDataset][isoCode]
    return config.colors[category] || config.colors['No Data']
  }

  const getCountryCategory = (isoCode) => {
    return allData[currentDataset][isoCode] || 'No Data'
  }

  const openCountryPopup = useCallback((name, isoCode, x, y) => {
    setClickedCountry({ name, isoCode })
    setPopupDataset(currentDataset)
    setLabelPosition({ x, y })
    setWikiData(null)
    setWikiLoading(true)

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
        setWikiData({
          extract: data.extract,
          thumbnail: data.thumbnail?.source,
          url: data.content_urls?.desktop?.page,
        })
        setWikiLoading(false)
      })
      .catch(() => setWikiLoading(false))
  }, [currentDataset])

  const handleCountryClick = (geo, event) => {
    event.stopPropagation()
    const isoCode = getIsoCode(geo)
    const countryName = geo.properties.NAME || geo.properties.ADMIN

    if (clickedCountry && clickedCountry.name === countryName) {
      setClickedCountry(null)
      setWikiData(null)
      return
    }

    openCountryPopup(countryName, isoCode, event.clientX, event.clientY)
  }

  const handleSearchSelect = (country) => {
    setSearchQuery('')
    setSearchOpen(false)
    // Open popup centered on screen
    openCountryPopup(country.name, country.isoCode, window.innerWidth / 2 - 144, window.innerHeight / 2 - 240)
  }

  const handleMapClick = () => {
    setClickedCountry(null)
    setWikiData(null)
  }

  const searchResults = searchQuery.length >= 1
    ? countriesRef.current
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)
    : []

  const hasErrors = Object.keys(loadErrors).length > 0

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Error banner */}
      {hasErrors && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-red-600 text-white text-xs px-4 py-2">
          Failed to load: {Object.keys(loadErrors).join(', ')} — refresh to retry
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#4A90E2]/80">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-sm font-medium text-gray-700">
            Loading map data...
          </div>
        </div>
      )}

      <ComposableMap
        width={800}
        height={500}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 185, center: [0, 10] }}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={mapPosition.zoom}
          center={mapPosition.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={`${BASE}/world-countries.json`}>
            {({ geographies }) => {
              // Build country list once for search
              if (!countriesBuilt.current && geographies.length > 0) {
                countriesRef.current = geographies
                  .map(geo => ({
                    name: geo.properties.NAME || geo.properties.ADMIN,
                    isoCode: getIsoCode(geo),
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))
                countriesBuilt.current = true
              }

              return geographies.map((geo) => {
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
                    onMouseEnter={() => setTooltipContent(`${countryName} - ${category}`)}
                    onMouseLeave={() => setTooltipContent("")}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#F0F0F0', outline: 'none', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover Tooltip */}
      {tooltipContent && !clickedCountry && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-10
                        text-sm font-medium whitespace-nowrap pointer-events-none">
          {tooltipContent}
        </div>
      )}

      {/* Search */}
      <div
        ref={searchRef}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-20 w-64"
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
              if (e.key === 'Enter' && searchResults.length > 0) handleSearchSelect(searchResults[0])
            }}
            className="w-full pl-8 pr-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200
                       text-sm text-gray-800 placeholder-gray-400 outline-none
                       focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {searchResults.map(country => (
              <button
                key={country.isoCode}
                onClick={() => handleSearchSelect(country)}
                className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50
                           border-b border-gray-50 last:border-0 flex items-center justify-between"
              >
                <span>{country.name}</span>
                <span
                  className="text-[10px] font-medium text-white rounded px-1.5 py-0.5 ml-2 flex-shrink-0"
                  style={{ backgroundColor: config.colors[getCountryCategory(country.isoCode)] || '#999' }}
                >
                  {getCountryCategory(country.isoCode)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Country Info Popup */}
      {clickedCountry && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-72"
          style={{
            left: `${Math.min(labelPosition.x + 16, window.innerWidth - 304)}px`,
            top: `${Math.min(Math.max(labelPosition.y + 16, 8), window.innerHeight - 520)}px`,
          }}
        >
          {wikiData?.thumbnail && (
            <img
              src={wikiData.thumbnail}
              alt={clickedCountry.name}
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

            <div className="font-bold text-base mb-2">{clickedCountry.name}</div>

            {/* Dataset tabs */}
            <div className="flex gap-1 mb-3">
              {Object.entries(DATASET_CONFIGS).map(([key, cfg]) => {
                const cat = allData[key][clickedCountry.isoCode] || 'No Data'
                const color = cfg.colors[cat] || cfg.colors['No Data']
                const active = popupDataset === key
                return (
                  <button
                    key={key}
                    onClick={() => setPopupDataset(key)}
                    className="flex-1 rounded-lg py-1.5 px-1 text-center transition-all border-2"
                    style={{
                      backgroundColor: active ? color + '33' : 'transparent',
                      borderColor: active ? color : '#e5e7eb',
                    }}
                  >
                    <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                      {DATASET_LABELS[key]}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Active classification badge */}
            {(() => {
              const cat = allData[popupDataset][clickedCountry.isoCode] || 'No Data'
              const color = DATASET_CONFIGS[popupDataset].colors[cat] || '#CCCCCC'
              return (
                <div
                  className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 mb-3 text-center"
                  style={{ backgroundColor: color }}
                >
                  {cat}
                </div>
              )
            })()}

            {wikiData?.extract && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {wikiData.extract}
              </p>
            )}

            {wikiData?.url && (
              <a
                href={wikiData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-blue-600 hover:underline"
              >
                Wikipedia →
              </a>
            )}

            {popupDataset === 'regime' && (
              <RegimeHistory isoCode={clickedCountry.isoCode} timeseries={timeseries} />
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="fixed top-4 right-4 flex flex-col gap-1 z-10">
        <button
          onClick={() => zoomAt(2.0)}
          className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 text-xl font-light text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >+</button>
        <button
          onClick={() => zoomAt(1 / 2.0)}
          className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 text-xl font-light text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >−</button>
      </div>

      {/* Dataset Toggle */}
      <div className="fixed top-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="font-bold text-xs text-gray-600">VIEW BY:</h3>
          <button
            onClick={() => setShowInfo(true)}
            aria-label="About this data"
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold flex items-center justify-center"
            title="About this data"
          >?</button>
        </div>
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

      {/* Creator */}
      <div className="fixed bottom-4 right-4 z-10 flex items-center gap-2 bg-white bg-opacity-80 rounded-full px-3 py-1.5 shadow border border-gray-200 text-xs text-gray-600">
        <span>by <a href="https://sirindudler.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Sirin Dudler</a></span>
        <a href="https://www.linkedin.com/in/sirindudler/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="https://github.com/sirindudler" target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="#24292e" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="https://sirindudler.com" target="_blank" rel="noopener noreferrer" title="Website" className="hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
        </a>
        <a href="https://ko-fi.com/sirindudler" target="_blank" rel="noopener noreferrer" title="Ko-fi" className="hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF5E5B"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.960-.049c.136-.007.398-.048.529-.048h1.476c.958 0 2.574-.105 3.810-.984 1.235-.878 1.560-2.180 1.560-3.108 0-.893-.375-1.594-.375-1.594zM19.748 12.460c-.27.697-.816 1.080-1.534 1.110-.718.030-1.353-.232-1.610-.773-.258-.541-.216-1.200.095-1.847.312-.648.862-1.080 1.580-1.110.719-.030 1.354.232 1.611.773.257.540.215 1.200-.142 1.847z"/></svg>
        </a>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="font-bold text-sm">{config.title}</h3>
          <button
            onClick={() => setShowInfo(true)}
            aria-label="About this data"
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold flex items-center justify-center"
            title="About this data"
          >?</button>
        </div>
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

      {showInfo && (
        <DataSourcesModal
          activeDataset={currentDataset}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}
