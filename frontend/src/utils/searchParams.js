const ALLOWED = [
  'city',
  'zip_code',
  'min_price',
  'max_price',
  'min_beds',
  'min_baths',
  'home_type',
  'max_key_money_months',
  'min_parking',
  'min_sqft',
  'max_sqft',
  'stories',
  'furnishing',
  'shared_bathroom',
  'min_land_size',
  'max_land_size',
  'land_unit',
  'deed_type',
  'has_video',
  'status',
  'search',
]

/** Turns an AI filter object into URLSearchParams the Search page understands. */
export function filtersToSearchParams(filters = {}) {
  const params = new URLSearchParams()
  ALLOWED.forEach((key) => {
    const value = filters[key]
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return params
}
