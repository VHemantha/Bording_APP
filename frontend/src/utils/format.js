export function formatPrice(price, status) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
  return status === 'for_rent' ? `${formatted}/mo` : formatted
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

export const HOME_TYPE_LABELS = {
  house: 'House',
  condo: 'Condo',
  townhouse: 'Townhouse',
  apartment: 'Apartment',
}
