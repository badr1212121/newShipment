import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (!markers || markers.length === 0) return
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 12)
      return
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds.pad(0.2))
  }, [map, markers])
  return null
}

export default function TrackingMap({
  markers = [],
  className = 'h-80 w-full',
  defaultCenter = [40, -74],
  defaultZoom = 4,
}) {
  const validMarkers = useMemo(
    () => (Array.isArray(markers) ? markers.filter((m) => m != null && m.lat != null && m.lng != null) : []),
    [markers]
  )

  if (validMarkers.length === 0) {
    return (
      <div
        className={`rounded flex items-center justify-center text-muted-foreground bg-muted ${className}`}
      >
        No locations to show
      </div>
    )
  }

  const center =
    validMarkers.length === 1
      ? [validMarkers[0].lat, validMarkers[0].lng]
      : defaultCenter

  return (
    <div className={`rounded overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={validMarkers} />
        {validMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]}>
            <Popup>{m.label || `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
