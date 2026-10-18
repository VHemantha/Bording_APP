import { registerPlaceNames } from '../i18n/translations'
import client from './client'

// One request per deal ('for_rent' / 'for_sale' / '' = all listings) per page load.
const cache = new Map()

/**
 * Sri Lanka's districts, each with its cities and towns and listing counts:
 * [{ key, name, si, ta, province, lat, lng, count, towns: [{ name, si, ta, count }] }].
 * The town names are registered for cityName(), so they show translated everywhere.
 */
export function fetchLocations(status = '') {
  if (!cache.has(status)) {
    const request = client
      .get('/locations/', { params: status ? { status } : {} })
      .then(({ data }) => {
        registerPlaceNames(data.districts)
        return data.districts
      })
      .catch((err) => {
        cache.delete(status) // let the next visit try again
        throw err
      })
    cache.set(status, request)
  }
  return cache.get(status)
}

/** A district's name in the visitor's language. */
export function districtLabel(district, lang) {
  return district ? district[lang] || district.name : ''
}
