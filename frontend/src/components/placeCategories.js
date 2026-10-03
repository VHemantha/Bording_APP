import {
  Dumbbell,
  GraduationCap,
  Hospital,
  Hotel,
  Scissors,
  ShoppingBasket,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Keys match properties/places.py CATEGORY_QUERIES on the backend; labels are t(`places.${key}`).
export const PLACE_CATEGORIES = [
  { key: 'school', icon: GraduationCap, color: '#2563eb' },
  { key: 'foodcity', icon: ShoppingCart, color: '#ea580c' },
  { key: 'keells', icon: ShoppingBasket, color: '#16a34a' },
  { key: 'hotel', icon: Hotel, color: '#7c3aed' },
  { key: 'hospital', icon: Hospital, color: '#dc2626' },
  { key: 'gym', icon: Dumbbell, color: '#0f766e' },
  { key: 'restaurant', icon: UtensilsCrossed, color: '#d97706' },
  { key: 'salon', icon: Scissors, color: '#c026d3' },
]

const BY_KEY = Object.fromEntries(PLACE_CATEGORIES.map((c) => [c.key, c]))

// Must match the backend's MAX_SPAN_DEGREES: bigger areas ask the user to zoom in.
export const MAX_PLACES_SPAN = 0.25

export const PLACE_MARKER_SIZE = 30

const svgCache = new Map()

/** A round marker in the category's colour with its white icon, as an SVG string. Used by
 *  both maps (a Leaflet divIcon and a Google Maps marker image). */
export function placeMarkerSvg(key) {
  if (svgCache.has(key)) return svgCache.get(key)
  const { icon, color } = BY_KEY[key]
  const s = PLACE_MARKER_SIZE
  const glyph = renderToStaticMarkup(
    createElement(icon, { size: 16, color: '#ffffff', strokeWidth: 2.25, x: (s - 16) / 2, y: (s - 16) / 2 })
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1.5}" fill="${color}" stroke="#ffffff" stroke-width="2"/>${glyph}</svg>`
  svgCache.set(key, svg)
  return svg
}
