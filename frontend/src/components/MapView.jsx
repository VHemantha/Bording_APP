import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'

import { formatPrice } from '../utils/format'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const highlightIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [34, 56],
  iconAnchor: [17, 56],
  popupAnchor: [1, -46],
  className: 'hue-rotate-180',
})

function FitBounds({ properties }) {
  const map = useMap()
  useMemo(() => {
    if (properties.length === 0) return
    const bounds = L.latLngBounds(
      properties.map((p) => [p.latitude, p.longitude])
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties])
  return null
}

export default function MapView({ properties, highlightedId, onMarkerHover }) {
  const center = properties.length
    ? [properties[0].latitude, properties[0].longitude]
    : [39.8283, -98.5795]

  return (
    <MapContainer center={center} zoom={11} className="w-full h-full">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} />
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={p.id === highlightedId ? highlightIcon : defaultIcon}
          eventHandlers={{
            mouseover: () => onMarkerHover?.(p.id),
            mouseout: () => onMarkerHover?.(null),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{formatPrice(p.price, p.status)}</p>
              <p>{p.beds} bd | {p.baths} ba | {p.sqft.toLocaleString()} sqft</p>
              <p className="text-gray-500">{p.address}</p>
              <Link to={`/property/${p.id}`} className="text-blue-600 underline">
                View details
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
