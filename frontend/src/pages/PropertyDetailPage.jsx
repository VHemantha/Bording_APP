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
import { formatBaths, formatPrice, HOME_TYPE_LABELS, statusLabel, STORIES_LABELS } from '../utils/format'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { openAuth } = useAuthModal()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchProperty(id)
      .then(setProperty)
      .catch(() => setError('Property not found.'))
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

  if (loading) return <PageLoader label="Loading home" />
  if (error || !property) {
    return (
      <div className="p-10 text-center text-slate-500">
        {error}{' '}
        <Link to="/search" className="font-semibold text-brand-600 underline">Back to search</Link>
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
        <ArrowLeft size={16} /> Back to results
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
                {statusLabel(property.status)}
              </span>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-900">
                {formatPrice(property.price, property.status)}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                <span className="inline-flex items-center gap-1.5"><BedDouble size={17} /> {property.beds} beds</span>
                <span className="inline-flex items-center gap-1.5"><Bath size={17} /> {formatBaths(property.baths)} baths</span>
                <span className="inline-flex items-center gap-1.5"><Ruler size={17} /> {property.sqft.toLocaleString()} sqft</span>
              </div>
              <p className="mt-2 text-slate-500">
                {property.address}, {property.city}, {property.state} {property.zip_code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              <Heart size={16} className={isFavorited ? 'fill-accent-500 text-accent-500' : ''} />
              {isFavorited ? 'Saved' : 'Save'}
            </button>
          </div>

          <hr className="my-6 border-slate-200" />

          <h2 className="font-display text-xl font-semibold text-brand-900">About this home</h2>
          <p className="mt-2 leading-relaxed text-slate-700">{property.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info label="Home type" value={HOME_TYPE_LABELS[property.home_type]} />
            <Info label="Key money" value={property.key_money ? formatPrice(property.key_money) : 'None'} />
            <Info label="Parking slots" value={property.parking_slots} />
            <Info label="Stories" value={STORIES_LABELS[property.stories] || '—'} />
            <Info label="Year built" value={property.year_built || '—'} />
            <Info label="Status" value={statusLabel(property.status)} />
            <Info label="Listed" value={property.listed_date} />
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
