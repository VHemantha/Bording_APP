import { useEffect, useState } from 'react'

// Public browser key (restrict it by HTTP referrer in Google Cloud). Baked in at build time.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const SRI_LANKA = { lat: 7.8731, lng: 80.7718 }

let mapsPromise
// Google reports a bad key (invalid, wrong referrer, billing off) only after the script has
// loaded, through the global gm_authFailure. Every map on the page listens for it so they can
// all switch to the OpenStreetMap fallback together.
let authFailed = false
const authListeners = new Set()

function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  mapsPromise ??= new Promise((resolve, reject) => {
    window.__placeMapsReady = () => resolve(window.google.maps)
    window.gm_authFailure = () => {
      authFailed = true
      authListeners.forEach((notify) => notify())
      reject(new Error('Google Maps rejected the API key'))
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&v=weekly&loading=async&callback=__placeMapsReady`
    script.async = true
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
  return mapsPromise
}

/**
 * Loads the Google Maps JavaScript API once for the whole app. Returns { maps, failed }:
 * `maps` is google.maps once ready; `failed` is true when there's no key, the script couldn't
 * load, or Google rejected the key - callers then show the OpenStreetMap map instead.
 */
export function useGoogleMaps() {
  const [state, setState] = useState(() => ({
    maps: window.google?.maps?.Map && !authFailed ? window.google.maps : null,
    failed: !API_KEY || authFailed,
  }))

  useEffect(() => {
    if (state.failed) return
    let cancelled = false
    const onAuthFailure = () => {
      if (!cancelled) setState({ maps: null, failed: true })
    }
    authListeners.add(onAuthFailure)
    loadGoogleMaps()
      .then((maps) => {
        if (!cancelled && !authFailed) setState({ maps, failed: false })
      })
      .catch(onAuthFailure)
    return () => {
      cancelled = true
      authListeners.delete(onAuthFailure)
    }
  }, [state.failed])

  return state
}
