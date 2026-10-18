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

/** The property types that can be listed or searched for 'for_sale' / 'for_rent'. */
export function homeTypesFor(status) {
  const all = Object.keys(HOME_TYPE_LABELS)
  return status === 'for_sale' ? all.filter((key) => !RENT_ONLY_TYPES.includes(key)) : all
}

// Every type except these gives the land size (matches Property.NO_LAND_SIZE_TYPES).
export const NO_LAND_SIZE_TYPES = ['apartment']

/** Land size: "20 perches", "1 perch", "1.5 acres" (in the visitor's language). */
export function formatLandSize(size, unit, t) {
  if (!size) return null
  const amount = Number.isInteger(size) ? size : Number(size.toFixed(2))
  const acres = unit === 'acre'
  const key = amount === 1 ? (acres ? 'land.acre' : 'land.perch') : acres ? 'land.acres' : 'land.perches'
  return t(key, { count: amount.toLocaleString() })
}

/** Choices for the most a buyer can pay as an advance, in LKR. */
export const ADVANCE_OPTIONS = [500000, 1000000, 2500000, 5000000, 10000000]

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
