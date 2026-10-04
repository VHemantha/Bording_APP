import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

import { mediaUrl } from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import { cityName } from '../i18n/translations'
import { formatBaths, formatKeyMoney, formatPrice } from '../utils/format'

export default function PropertyCard({
  property,
  isFavorited = false,
  onToggleFavorite,
  onHover,
  highlighted = false,
  index = 0,
}) {
  const { lang, t } = useLanguage()

  function handleFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(property)
  }

  // Land has no rooms, so those chips are left out rather than showing "0 bd".
  const chips = [
    property.beds > 0 && [property.beds, t('unit.bd')],
    property.baths > 0 && [formatBaths(property.baths), t('unit.ba')],
    [property.sqft.toLocaleString(), t('unit.sqft')],
  ].filter(Boolean)

  const extras = [
    property.key_money_months > 0
      ? t('card.keyMoney', { amount: formatKeyMoney(property.key_money_months, t) })
      : t('card.noKeyMoney'),
    property.parking_slots > 0 && t('card.parking', { count: property.parking_slots }),
    property.stories && t(`stories.${property.stories}`),
    property.furnishing && t(`furnishing.${property.furnishing}`),
  ].filter(Boolean)

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
        className={`group block overflow-hidden rounded-xl bg-white shadow-soft transition duration-300 hover:shadow-lift ${
          highlighted ? 'ring-2 ring-brand-500' : 'ring-1 ring-slate-200'
        }`}
      >
        <div className="relative overflow-hidden">
          <img
            src={mediaUrl(property.primary_image_url)}
            alt={property.address}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white shadow">
              {t(`type.${property.home_type}`)}
            </span>
            <span className="rounded-full bg-brand-900/80 px-3 py-1 text-sm font-bold text-white shadow">
              {t(`status.${property.status}`)}
            </span>
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFavorited ? t('card.unsave') : t('card.save')}
              className="absolute right-3 top-3 transition hover:scale-110"
            >
              <Heart
                size={34}
                strokeWidth={2.25}
                className={`drop-shadow-md ${
                  isFavorited ? 'fill-accent-500 text-white' : 'fill-black/30 text-white'
                }`}
              />
            </button>
          )}
        </div>

        <div className="p-4">
          <p className="text-2xl font-extrabold text-brand-900">
            {formatPrice(property.price, property.status, t('unit.perMonth'))}
          </p>
          <p className="mt-1 truncate text-slate-600">
            {property.address} <span className="text-slate-300">|</span> {cityName(property.city, lang)}, {property.state}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map(([value, unit]) => (
              <span
                key={unit}
                className="flex-auto whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 text-center text-sm text-slate-600"
              >
                <span className="text-base font-bold text-brand-900">{value}</span> {unit}
              </span>
            ))}
          </div>
          <p className="mt-3 truncate text-sm text-slate-600">
            <span className="font-bold text-brand-900">{extras[0]}</span>
            {extras.slice(1).map((text) => (
              <span key={text}> &bull; {text}</span>
            ))}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-slate-200">
      <div className="skeleton h-56 w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-7 w-32 rounded" />
        <div className="skeleton h-4 w-52 rounded" />
        <div className="skeleton h-9 w-full rounded-full" />
      </div>
    </div>
  )
}
