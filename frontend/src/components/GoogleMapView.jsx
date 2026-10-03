import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import { formatCompactPrice, formatPrice } from '../utils/format'
import MapView from './MapView'

// Public browser key (restrict it by HTTP referrer in Google Cloud). Baked in at build time.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const SRI_LANKA = { lat: 7.8731, lng: 80.7718 }

let mapsPromise

function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  mapsPromise ??= new Promise((resolve, reject) => {
    window.__nestwellMapsReady = () => resolve(window.google.maps)
    // Google calls this global when the key is invalid, restricted, or billing is off.
    window.gm_authFailure = () => reject(new Error('Google Maps rejected the API key'))
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&v=weekly&loading=async&callback=__nestwellMapsReady`
    script.async = true
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
  return mapsPromise
}

/** Rounded price pill, drawn as an SVG so the marker needs no extra Google library. */
function pillIcon(maps, text, active) {
  const width = Math.max(46, text.length * 8 + 20)
  const height = 28
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${(height - 3) / 2}" fill="${active ? '#0b1220' : '#6d28d9'}" stroke="#fff" stroke-width="2"/></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(width, height),
    anchor: new maps.Point(width / 2, height / 2),
    labelOrigin: new maps.Point(width / 2, height / 2),
  }
}

/**
 * Listings on a Google map. Falls back to the OpenStreetMap view (MapView) when no API key
 * is configured or Google rejects it, so the page never shows a broken map.
 */
export default function GoogleMapView({ properties, highlightedId, onMarkerHover }) {
  const [failed, setFailed] = useState(!API_KEY)
  const [maps, setMaps] = useState(null)
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const infoRef = useRef(null)
  const markersRef = useRef(new Map())
  const hoverRef = useRef(onMarkerHover)
  const navigate = useNavigate()
  const { t } = useLanguage()

  useEffect(() => {
    hoverRef.current = onMarkerHover
  }, [onMarkerHover])

  useEffect(() => {
    if (failed) return
    let cancelled = false
    loadGoogleMaps()
      .then((m) => {
        if (!cancelled) setMaps(m)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    // An invalid key is only reported after the script has loaded.
    const previous = window.gm_authFailure
    window.gm_authFailure = () => setFailed(true)
    return () => {
      cancelled = true
      window.gm_authFailure = previous
    }
  }, [failed])

  useEffect(() => {
    if (!maps || failed || mapRef.current || !containerRef.current) return
    mapRef.current = new maps.Map(containerRef.current, {
      center: SRI_LANKA,
      zoom: 8,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: maps.ControlPosition.RIGHT_BOTTOM,
      },
      zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
      gestureHandling: 'greedy',
      clickableIcons: false,
    })
    infoRef.current = new maps.InfoWindow()
  }, [maps, failed])

  // Rebuild the markers whenever the result set changes, then frame them.
  useEffect(() => {
    const map = mapRef.current
    if (!maps || failed || !map) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = new Map()
    infoRef.current?.close()

    const bounds = new maps.LatLngBounds()
    properties.forEach((p) => {
      const position = { lat: p.latitude, lng: p.longitude }
      const text = formatCompactPrice(p.price)
      const marker = new maps.Marker({
        map,
        position,
        title: p.address,
        icon: pillIcon(maps, text, false),
        label: { text, color: '#ffffff', fontSize: '12px', fontWeight: '700' },
      })
      marker.nestwellText = text
      marker.addListener('mouseover', () => hoverRef.current?.(p.id))
      marker.addListener('mouseout', () => hoverRef.current?.(null))
      marker.addListener('click', () => {
        const node = document.createElement('div')
        node.style.cssText = 'font: 14px Manrope, sans-serif; min-width: 170px'
        const price = document.createElement('strong')
        price.textContent = formatPrice(p.price, p.status, t('unit.perMonth'))
        const address = document.createElement('div')
        address.textContent = `${p.address}, ${p.city}`
        address.style.cssText = 'color: #475569; margin: 2px 0 6px'
        const link = document.createElement('a')
        link.href = `/property/${p.id}`
        link.textContent = t('map.viewDetails')
        link.style.cssText = 'color: #2a3fd4; font-weight: 700'
        link.addEventListener('click', (e) => {
          e.preventDefault()
          navigate(`/property/${p.id}`)
        })
        node.append(price, address, link)
        infoRef.current.setContent(node)
        infoRef.current.open({ map, anchor: marker })
      })
      markersRef.current.set(p.id, marker)
      bounds.extend(position)
    })

    if (properties.length === 0) {
      map.setCenter(SRI_LANKA)
      map.setZoom(8)
    } else {
      map.fitBounds(bounds, 56)
      // A single listing would otherwise zoom in to street level.
      maps.event.addListenerOnce(map, 'idle', () => {
        if (map.getZoom() > 15) map.setZoom(15)
      })
    }
  }, [maps, failed, properties, navigate, t])

  // Emphasise the marker of the card being hovered.
  useEffect(() => {
    if (!maps || failed) return
    markersRef.current.forEach((marker, id) => {
      const active = id === highlightedId
      marker.setIcon(pillIcon(maps, marker.nestwellText, active))
      marker.setZIndex(active ? 1000 : undefined)
    })
  }, [maps, failed, highlightedId, properties])

  if (failed) {
    return <MapView properties={properties} highlightedId={highlightedId} onMarkerHover={onMarkerHover} />
  }

  return <div ref={containerRef} className="h-full w-full bg-slate-200" />
}
