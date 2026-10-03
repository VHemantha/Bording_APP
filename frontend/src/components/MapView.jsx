import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import { formatPrice } from '../utils/format'
import { PLACE_MARKER_SIZE, placeMarkerSvg } from './placeCategories'

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
  // Keyed on the actual coordinates, not the array: callers may pass a fresh array each
  // render (e.g. [property]), and re-fitting on every render would move the map, report new
  // bounds, re-render the parent, and loop.
  const key = properties.map((p) => `${p.latitude},${p.longitude}`).join(';')
  useEffect(() => {
    if (!key) return
    const bounds = L.latLngBounds(key.split(';').map((pair) => pair.split(',').map(Number)))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [key, map])
  return null
}

const placeIcons = new Map()

function placeIcon(category) {
  if (!placeIcons.has(category)) {
    const half = PLACE_MARKER_SIZE / 2
    placeIcons.set(
      category,
      L.divIcon({
        html: placeMarkerSvg(category),
        className: 'place-marker', // replaces Leaflet's default white square
        iconSize: [PLACE_MARKER_SIZE, PLACE_MARKER_SIZE],
        iconAnchor: [half, half],
        popupAnchor: [0, -half],
      })
    )
  }
  return placeIcons.get(category)
}

function report(map, onChange) {
  const b = map.getBounds()
  onChange?.({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() })
}

/** Tells the parent which area is visible (for the "Nearby places" lookup). */
function BoundsReporter({ onChange }) {
  const map = useMapEvents({
    moveend: () => report(map, onChange),
  })
  // Also report the starting view (FitBounds may have already moved the map).
  useEffect(() => {
    report(map, onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

export default function MapView({ properties, highlightedId, onMarkerHover, places = [], onBoundsChange }) {
  const { t } = useLanguage()
  const center = properties.length
    ? [properties[0].latitude, properties[0].longitude]
    : [7.8731, 80.7718] // centre of Sri Lanka

  return (
    <MapContainer center={center} zoom={properties.length ? 11 : 8} className="w-full h-full">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} />
      {onBoundsChange && <BoundsReporter onChange={onBoundsChange} />}
      {places.map((place) => (
        <Marker key={place.id} position={[place.lat, place.lng]} icon={placeIcon(place.category)} zIndexOffset={-100}>
          <Popup>
            <p className="font-bold">{place.name || t('places.unnamed')}</p>
            <p className="text-gray-500">{t(`places.${place.category}`)}</p>
          </Popup>
        </Marker>
      ))}
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
              <p className="font-bold">{formatPrice(p.price, p.status, t('unit.perMonth'))}</p>
              <p>{p.beds} {t('unit.bd')} | {p.baths} {t('unit.ba')} | {p.sqft.toLocaleString()} {t('unit.sqft')}</p>
              <p className="text-gray-500">{p.address}</p>
              <Link to={`/property/${p.id}`} className="text-blue-600 underline">
                {t('map.viewDetails')}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
