import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Search, Loader2, MapPin } from 'lucide-react'

// Centre par défaut sur le Cameroun quand aucun point n'est encore choisi.
const DEFAULT_CENTER = [7.3697, 12.3547]
const DEFAULT_ZOOM = 6
const COORDINATE_ZOOM = 15

// Marqueur maison : j'évite les icônes par défaut de Leaflet qui pointent vers
// des assets cassés sous Vite. Un simple pin généré en SVG suffit.
const schoolIcon = L.divIcon({
  className: '',
  html: `
    <svg width="30" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#0d7a4f" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
})

// Clic sur la carte : le point devient la position de l'établissement.
function MapClickHandler({ onCoordinateChange }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng
      onCoordinateChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
    },
  })
  return null
}

// Recentre et zoome sur chaque nouvelle position (clic ou résultat de
// recherche) pour garder le marqueur bien visible.
function RecenterOnPoint({ latitude, longitude }) {
  const map = useMap()
  useEffect(() => {
    if (latitude == null || longitude == null || latitude === '' || longitude === '') return
    map.flyTo([Number(latitude), Number(longitude)], COORDINATE_ZOOM, { duration: 1.2 })
  }, [latitude, longitude, map])
  return null
}

export default function LocationPicker({ latitude, longitude, onCoordinateChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const hasCoordinates = latitude != null && longitude != null && latitude !== '' && longitude !== ''

  async function handleSearch(event) {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setSearching(true)
    setSearchError('')
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      )
      if (!response.ok) throw new Error('Search failed')
      const results = await response.json()
      if (results.length === 0) {
        setSearchError('No place found for this address.')
        return
      }
      const { lat, lon } = results[0]
      onCoordinateChange(Number(Number(lat).toFixed(6)), Number(Number(lon).toFixed(6)))
    } catch {
      setSearchError('Address search is unavailable right now.')
    } finally {
      setSearching(false)
    }
  }

  const center = hasCoordinates ? [Number(latitude), Number(longitude)] : DEFAULT_CENTER

  return (
    <div className="space-y-2">
      {/* Recherche d'adresse : géocodage Nominatim, sans clé ni middleware. */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a90a0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search an address or city (e.g. Douala, Bonanjo)…"
            className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] pl-9 pr-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#0d7a4f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a5e3d] disabled:pointer-events-none disabled:opacity-50"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
          Locate
        </button>
      </form>

      {searchError && <p className="text-xs text-red-600">{searchError}</p>}

      <MapContainer
        center={center}
        zoom={hasCoordinates ? COORDINATE_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: '300px', borderRadius: '0.75rem', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onCoordinateChange={onCoordinateChange} />
        {/* Le marqueur suit les coordonnées contrôlées par le formulaire. */}
        {hasCoordinates ? (
          <Marker position={[Number(latitude), Number(longitude)]} icon={schoolIcon} />
        ) : null}
        <RecenterOnPoint latitude={latitude} longitude={longitude} />
      </MapContainer>

      <p className="text-xs text-[#8a90a0]">
        Click on the map to place the school marker — the coordinates are filled in automatically.
      </p>
    </div>
  )
}
