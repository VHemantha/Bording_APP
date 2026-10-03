/** `perMonth` is the rent suffix; pass t('unit.perMonth') to show it in the visitor's language. */
export function formatPrice(price, status, perMonth = '/mo') {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
  return status === 'for_rent' ? `${formatted}${perMonth}` : formatted
}

export function formatCompactPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
}

export const STORIES_LABELS = {
  1: 'Single story',
  2: 'Two story',
  3: 'Three story',
}
