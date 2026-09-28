import { motion } from 'framer-motion'
import { Bath, BedDouble, Heart, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatBaths, formatPrice, HOME_TYPE_LABELS, statusLabel } from '../utils/format'

export default function PropertyCard({
  property,
  isFavorited = false,
  onToggleFavorite,
  onHover,
  highlighted = false,
  index = 0,
}) {
  function handleFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(property)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={`/property/${property.id}`}
        onMouseEnter={() => onHover?.(property.id)}
        onMouseLeave={() => onHover?.(null)}
        className={`group block overflow-hidden rounded-2xl border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
          highlighted ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200/80'
        }`}
      >
        <div className="relative overflow-hidden">
          <img
            src={property.primary_image_url}
            alt={property.address}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow ${
              property.status === 'for_rent' ? 'bg-brand-600' : 'bg-leaf-600'
            }`}
          >
            {statusLabel(property.status)}
          </span>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFavorited ? 'Remove from saved' : 'Save home'}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow transition hover:scale-110"
            >
              <Heart
                size={17}
                className={isFavorited ? 'fill-accent-500 text-accent-500' : ''}
              />
            </button>
          )}
        </div>

        <div className="p-4">
          <p className="text-lg font-bold text-brand-900">
            {formatPrice(property.price, property.status)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <BedDouble size={15} /> {property.beds} bd
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath size={15} /> {formatBaths(property.baths)} ba
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler size={15} /> {property.sqft.toLocaleString()} sqft
            </span>
          </div>
          <p className="mt-2 truncate text-sm text-slate-500">
            {property.address}, {property.city}, {property.state} {property.zip_code}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-400">
            {HOME_TYPE_LABELS[property.home_type] ?? property.home_type}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
      <div className="skeleton h-52 w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-5 w-24 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-4 w-52 rounded" />
      </div>
    </div>
  )
}
