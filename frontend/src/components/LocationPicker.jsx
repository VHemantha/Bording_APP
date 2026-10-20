import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { useLanguage } from '../context/LanguageContext'
import { SRI_LANKA, useGoogleMaps } from './googleMaps'

/**
 * Map for choosing a listing's exact location: click to drop the pin, drag to adjust, or use
 * the device's location. `value` is { lat, lng } or null; `focus` ({ lat, lng, zoom })
 * recentres the map (e.g. when a city is chosen). Google Maps, with the OpenStreetMap map as
 * a fallback when there's no API key or Google rejects it.
 */
export default function LocationPicker({ value, onChange, focus, invalid }) {
  const { t } = useLanguage()
  const { maps, failed } = useGoogleMaps()
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [localFocus, setLocalFocus] = useState(null)

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude }
        onChange(point)
        setLocalFocus({ ...point, zoom: 17 })
        setLocating(false)
      },
      // Denied, or no fix: say so, and point to placing the pin by hand.
      (err) => {
        setGeoError(err.code === 1 ? 'post.locationDenied' : 'post.locationFailed')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const mapProps = { value, onChange, focus: localFocus ?? focus }

  return (
    <div>
      <div
        className={`isolate h-72 overflow-hidden rounded-xl border sm:h-80 ${
          invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
        }`}
      >
        {failed ? (
          <LeafletPickerMap {...mapProps} />
        ) : maps ? (
          <GooglePickerMap maps={maps} {...mapProps} />
        ) : (
          <div className="h-full w-full bg-slate-200" aria-hidden />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className={invalid || geoError ? 'font-medium text-red-600' : 'text-slate-500'}>
          {geoError ? t(geoError) : invalid ? t('post.locationMissing') : t('post.mapHint')}
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

function GooglePickerMap({ maps, value, onChange, focus }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Create the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = new maps.Map(containerRef.current, {
      center: value ?? SRI_LANKA,
      zoom: value ? 16 : 8,
      streetViewControl: false,
      fullscreenControl: false,
      // Satellite view makes it much easier to put the pin on the right building.
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: maps.ControlPosition.TOP_RIGHT,
      },
      // Inside a scrolling form: one finger scrolls the page, two fingers move the map.
      gestureHandling: 'cooperative',
      clickableIcons: false,
      draggableCursor: 'crosshair',
    })
    map.addListener('click', (e) => onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() }))
    mapRef.current = map
    // `value` only seeds the first view; later changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps])

  // Keep the draggable pin in sync with the chosen location.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!value) {
      markerRef.current?.setMap(null)
      markerRef.current = null
      return
    }
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ map, position: value, draggable: true })
      markerRef.current.addListener('dragend', (e) =>
        onChangeRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      )
    } else {
      markerRef.current.setPosition(value)
    }
  }, [maps, value])

  // Recentre when a city is chosen or the device location arrives.
  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.setCenter({ lat: focus.lat, lng: focus.lng })
      mapRef.current.setZoom(focus.zoom ?? 15)
    }
  }, [focus])

  return <div ref={containerRef} className="h-full w-full bg-slate-200" />
}

// ---- OpenStreetMap fallback (no Google key, or Google rejected it) ----

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickToPlace({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

function FlyTo({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.setView([focus.lat, focus.lng], focus.zoom ?? 15)
  }, [focus, map])
  return null
}

function LeafletPickerMap({ value, onChange, focus }) {
  const start = value ? [value.lat, value.lng] : [SRI_LANKA.lat, SRI_LANKA.lng]
  return (
    <MapContainer center={start} zoom={value ? 16 : 8} className="h-full w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onPick={onChange} />
      <FlyTo focus={focus} />
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
  )
}
