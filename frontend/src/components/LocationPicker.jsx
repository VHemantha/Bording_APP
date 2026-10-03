import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { useLanguage } from '../context/LanguageContext'

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const SRI_LANKA = [7.8731, 80.7718]

function ClickToPlace({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

/** Moves the map when `focus` changes (a city was chosen, or "use my location"). */
function FlyTo({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.setView([focus.lat, focus.lng], focus.zoom ?? 15)
  }, [focus, map])
  return null
}

/**
 * Map for choosing a listing's exact location: click to drop the pin, drag to adjust.
 * `value` is { lat, lng } or null; `focus` ({ lat, lng, zoom }) recentres the map.
 */
export default function LocationPicker({ value, onChange, focus, invalid }) {
  const { t } = useLanguage()
  const [locating, setLocating] = useState(false)
  const [localFocus, setLocalFocus] = useState(null)
  const start = value ? [value.lat, value.lng] : SRI_LANKA

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude }
        onChange(point)
        setLocalFocus({ ...point, zoom: 17 })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      <div
        className={`isolate h-72 overflow-hidden rounded-xl border sm:h-80 ${
          invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
        }`}
      >
        <MapContainer center={start} zoom={value ? 16 : 8} className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={onChange} />
          <FlyTo focus={localFocus ?? focus} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng()
                  onChange({ lat, lng })
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className={invalid ? 'font-medium text-red-600' : 'text-slate-500'}>
          {invalid ? t('post.locationMissing') : t('post.mapHint')}
        </p>
        {'geolocation' in navigator && (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline disabled:opacity-60"
          >
            <LocateFixed size={15} /> {t('post.useMyLocation')}
          </button>
        )}
      </div>
    </div>
  )
}
