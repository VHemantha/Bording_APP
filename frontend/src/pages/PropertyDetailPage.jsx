import { motion } from 'framer-motion'
import { ArrowLeft, Bath, BedDouble, Heart, Ruler } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperty } from '../api/properties'
import MapView from '../components/MapView'
import PageLoader from '../components/PageLoader'
import PhotoGallery from '../components/PhotoGallery'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import { cityName } from '../i18n/translations'
import { formatBaths, formatPrice } from '../utils/format'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { openAuth } = useAuthModal()
  const { lang, t } = useLanguage()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchProperty(id)
      .then(setProperty)
      .catch(() => setError('detail.notFound'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) {
      setIsFavorited(false)
      return
    }
    fetchFavorites()
      .then((favs) => setIsFavorited(favs.some((f) => f.property.id === Number(id))))
      .catch(() => setIsFavorited(false))
  }, [user, id])

  async function handleToggleFavorite() {
    if (!user) {
      openAuth('login')
      return
    }
    const next = !isFavorited
    setIsFavorited(next)
    try {
      if (next) await addFavorite(Number(id))
      else await removeFavorite(Number(id))
    } catch {
      setIsFavorited(!next)
    }
  }

  if (loading) return <PageLoader label={t('detail.loading')} />
  if (error || !property) {
    return (
      <div className="p-10 text-center text-slate-500">
        {t(error || 'detail.notFound')}{' '}
        <Link to="/search" className="font-semibold text-brand-600 underline">{t('detail.backToSearch')}</Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl px-4 py-6"
    >
      <Link
        to="/search"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      >
        <ArrowLeft size={16} /> {t('detail.backToResults')}
      </Link>

      <PhotoGallery images={property.images} altText={property.address} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                  property.status === 'for_rent' ? 'bg-brand-600' : 'bg-leaf-600'
                }`}
              >
                {t(`status.${property.status}`)}
              </span>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-900">
                {formatPrice(property.price, property.status, t('unit.perMonth'))}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                <span className="inline-flex items-center gap-1.5"><BedDouble size={17} /> {property.beds} {t('unit.beds')}</span>
                <span className="inline-flex items-center gap-1.5"><Bath size={17} /> {formatBaths(property.baths)} {t('unit.baths')}</span>
                <span className="inline-flex items-center gap-1.5"><Ruler size={17} /> {property.sqft.toLocaleString()} {t('unit.sqft')}</span>
              </div>
              <p className="mt-2 text-slate-500">
                {property.address}, {cityName(property.city, lang)}, {property.state} {property.zip_code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              <Heart size={16} className={isFavorited ? 'fill-accent-500 text-accent-500' : ''} />
              {isFavorited ? t('detail.saved') : t('detail.save')}
            </button>
          </div>

          <hr className="my-6 border-slate-200" />

          <h2 className="font-display text-xl font-semibold text-brand-900">{t('detail.about')}</h2>
          <p className="mt-2 leading-relaxed text-slate-700">{property.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info label={t('detail.homeType')} value={t(`type.${property.home_type}`)} />
            <Info label={t('filter.keyMoney')} value={property.key_money ? formatPrice(property.key_money) : t('common.none')} />
            <Info label={t('filter.parking')} value={property.parking_slots} />
            <Info label={t('detail.stories')} value={property.stories ? t(`stories.${property.stories}`) : '—'} />
            <Info label={t('detail.yearBuilt')} value={property.year_built || '—'} />
            <Info label={t('detail.status')} value={t(`status.${property.status}`)} />
            <Info label={t('detail.listed')} value={property.listed_date} />
          </div>
        </div>

        <div className="h-72 overflow-hidden rounded-2xl border border-slate-200 lg:h-full">
          <MapView properties={[property]} />
        </div>
      </div>
    </motion.div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold text-brand-900">{value}</p>
    </div>
  )
}
