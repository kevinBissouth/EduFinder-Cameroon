import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'

const STREET_ZOOM = 15

// Marqueur maison : les icônes par défaut de Leaflet pointent vers des
// fichiers introuvables sous Vite. Sa couleur vient de la classe du thème.
const schoolMarker = L.divIcon({
  className: 'text-primary',
  html: `
    <svg width="30" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
})

// Carte en lecture seule. Le zoom à la molette est coupé pour ne pas capturer
// le défilement de la page ; les boutons + et − restent disponibles.
function SchoolMap({ latitude, longitude }) {
  const position = [Number(latitude), Number(longitude)]

  return (
    <MapContainer
      center={position}
      zoom={STREET_ZOOM}
      scrollWheelZoom={false}
      className="isolate z-0 h-80 w-full rounded-panel"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={schoolMarker} />
    </MapContainer>
  )
}

export default SchoolMap
