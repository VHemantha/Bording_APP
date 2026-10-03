import { useEffect, useState } from 'react'

import client from '../api/client'
import { MAX_PLACES_SPAN } from './placeCategories'

/**
 * Loads points of interest for the selected categories inside the map's current view.
 * `bounds` is { south, west, north, east } (or null before the map has reported it).
 * Returns { places, status }, status being idle | loading | ready | partial | zoom | error.
 * Places already shown stay on the map while the next area loads.
 */
export default function useNearbyPlaces(categories, bounds) {
  const [state, setState] = useState({ places: [], status: 'idle' })
  const categoryKey = [...categories].sort().join(',')
  // Rounded so tiny pans don't trigger a new request.
  const boundsKey = bounds
    ? [bounds.south, bounds.west, bounds.north, bounds.east].map((v) => v.toFixed(3)).join(',')
    : ''

  useEffect(() => {
    if (!categoryKey || !boundsKey) {
      setState({ places: [], status: 'idle' })
      return
    }
    const [south, west, north, east] = boundsKey.split(',').map(Number)
    if (north - south > MAX_PLACES_SPAN || east - west > MAX_PLACES_SPAN) {
      setState({ places: [], status: 'zoom' })
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, status: 'loading' }))
      client
        .get('/places/', { params: { categories: categoryKey, south, west, north, east } })
        .then(({ data }) => {
          if (!cancelled) setState({ places: data.places, status: data.unavailable.length ? 'partial' : 'ready' })
        })
        .catch((err) => {
          if (!cancelled) setState({ places: [], status: err?.response?.data?.code === 'zoom' ? 'zoom' : 'error' })
        })
    }, 400) // wait for the map to settle after a pan/zoom
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [categoryKey, boundsKey])

  return state
}
