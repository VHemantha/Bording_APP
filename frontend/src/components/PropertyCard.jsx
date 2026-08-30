import { Link } from 'react-router-dom'

import { formatBaths, formatPrice, HOME_TYPE_LABELS } from '../utils/format'

export default function PropertyCard({
  property,
  isFavorited = false,
  onToggleFavorite,
  onHover,
  highlighted = false,
}) {
  function handleFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(property)
  }

  return (
    <Link
      to={`/property/${property.id}`}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`block bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
        highlighted ? 'ring-2 ring-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="relative">
        <img
          src={property.primary_image_url}
          alt={property.address}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <span className="absolute top-2 left-2 bg-white/90 text-xs font-semibold px-2 py-1 rounded">
          {property.status === 'for_rent' ? 'For Rent' : 'For Sale'}
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Save home"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-lg"
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">
          {formatPrice(property.price, property.status)}
        </p>
        <p className="text-sm text-gray-700">
          {property.beds} bd | {formatBaths(property.baths)} ba | {property.sqft.toLocaleString()} sqft
        </p>
        <p className="text-sm text-gray-500 truncate">
          {property.address}, {property.city}, {property.state} {property.zip_code}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {HOME_TYPE_LABELS[property.home_type] ?? property.home_type}
        </p>
      </div>
    </Link>
  )
}
