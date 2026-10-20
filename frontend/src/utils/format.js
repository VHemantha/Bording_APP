/** Prices are Sri Lankan rupees, shown as "LKR 45,000". `perMonth` is the rent suffix; pass
 *  t('unit.perMonth') to show it in the visitor's language. */
export function formatPrice(price, status, perMonth = '/mo') {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(price)
  return status === 'for_rent' ? `${formatted}${perMonth}` : formatted
}

export function formatCompactPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    currencyDisplay: 'code',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(price)
}

export function formatBaths(baths) {
  return Number.isInteger(baths) ? baths : baths.toFixed(1)
}

export function statusLabel(status) {
  return status === 'for_rent' ? 'For Rent' : 'For Sale'
}

// Keys match Property.HomeType / Property.Stories on the backend. These English labels are
// the fallback; screens show t(`type.${key}`) / t(`stories.${key}`) from the translations.
export const HOME_TYPE_LABELS = {
  house: 'House',
  apartment: 'Apartment',
  annex: 'Annex',
  land: 'Land',
  upper_floor_house: 'Upper floor house',
  shop: 'Shop',
  commercial: 'Commercial property',
}

// Property types that are only ever rented out, never sold (matches Property.RENT_ONLY_TYPES).
export const RENT_ONLY_TYPES = ['annex', 'upper_floor_house']

/** The property types that can be listed or searched for 'for_sale' / 'for_rent'. For sale,
 *  shops and commercial property are one type ("Shop / commercial", the commercial key). */
export function homeTypesFor(status) {
  const all = Object.keys(HOME_TYPE_LABELS)
  return status === 'for_sale' ? all.filter((key) => !RENT_ONLY_TYPES.includes(key) && key !== 'shop') : all
}

/** A property type's name; for sale, commercial reads "Shop / commercial property". */
export function typeLabel(type, status, t) {
  return status === 'for_sale' && type === 'commercial' ? t('type.shopCommercial') : t(`type.${type}`)
}

// Homes: the types with bedrooms, bathrooms and furnishing (matches Property.RESIDENTIAL_TYPES).
export const RESIDENTIAL_TYPES = ['house', 'annex', 'upper_floor_house', 'apartment']

// Sri Lankan land titles, for land for sale (matches Property.DeedType); names: t(`deed.${key}`).
export const DEED_TYPES = ['sinnakkara', 'bimsaviya', 'jayabhoomi', 'swarnabhoomi', 'permit', 'leasehold', 'other']

/**
 * The optional details a listing of this type has, for sale or rent (matches
 * Property.fields_for): rooms, shared_bathroom, furnishing, stories, sqft, parking,
 * land_size, key_money, deed_type. The forms only ask for these and listings only show them.
 */
export function listingFields(status, type) {
  const selling = status === 'for_sale'
  const land = type === 'land'
  const fields = new Set()
  if (RESIDENTIAL_TYPES.includes(type)) {
    fields.add('rooms').add('furnishing')
    if (!selling) fields.add('shared_bathroom')
  }
  if (!land && type !== 'shop') fields.add('stories')
  if (!land) fields.add('sqft').add('parking')
  if (landSizeApplies(status, type)) fields.add('land_size')
  if (!selling) fields.add('key_money')
  if (selling && land) fields.add('deed_type')
  return fields
}

/** The 11-character id of a YouTube video link (watch, youtu.be, shorts, embed), or null. */
export function youtubeId(url) {
  const match = (url || '')
    .trim()
    .match(/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})(?:[?&#/].*)?$/)
  return match ? match[1] : null
}

// Never have a land size (matches Property.NO_LAND_SIZE_TYPES).
export const NO_LAND_SIZE_TYPES = ['apartment', 'annex']

/** Whether a listing gives its land size (matches Property.land_size_applies): for sale,
 *  every type except apartments and annexes; for rent, land only. */
export function landSizeApplies(status, homeType) {
  if (NO_LAND_SIZE_TYPES.includes(homeType)) return false
  return status === 'for_sale' || homeType === 'land'
}

/** Land size: "20 perches", "1 perch", "1.5 acres" (in the visitor's language). */
export function formatLandSize(size, unit, t) {
  if (!size) return null
  const amount = Number.isInteger(size) ? size : Number(size.toFixed(2))
  const acres = unit === 'acre'
  const key = amount === 1 ? (acres ? 'land.acre' : 'land.perch') : acres ? 'land.acres' : 'land.perches'
  return t(key, { count: amount.toLocaleString() })
}

export const STORIES_LABELS = {
  1: 'Single story',
  2: 'Two story',
  3: 'Three story',
}

/** Key money is a number of months' rent (0-12): "6 months", "1 month" or "No key money". */
export function formatKeyMoney(months, t) {
  if (!months) return t('card.noKeyMoney')
  return months === 1 ? t('keyMoney.oneMonth') : t('keyMoney.months', { count: months })
}
