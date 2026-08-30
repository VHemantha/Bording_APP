export function formatPrice(price, status) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
  return status === 'for_rent' ? `${formatted}/mo` : formatted
}

export function formatBaths(baths) {
  return Number.isInteger(baths) ? baths : baths.toFixed(1)
}

export const HOME_TYPE_LABELS = {
  house: 'House',
  condo: 'Condo',
  townhouse: 'Townhouse',
  apartment: 'Apartment',
}
