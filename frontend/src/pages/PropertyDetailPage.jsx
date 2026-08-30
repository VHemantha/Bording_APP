import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperty } from '../api/properties'
import MapView from '../components/MapView'
import PhotoGallery from '../components/PhotoGallery'
import { useAuth } from '../context/AuthContext'
import { formatBaths, formatPrice, HOME_TYPE_LABELS } from '../utils/format'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

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
      navigate('/login')
      return
    }
    const next = !isFavorited
    setIsFavorited(next)
    try {
      if (next) {
        await addFavorite(Number(id))
      } else {
        await removeFavorite(Number(id))
      }
    } catch {
      setIsFavorited(!next)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }
  if (error || !property) {
    return (
      <div className="p-8 text-center text-gray-500">
        {error}{' '}
        <Link to="/search" className="text-blue-600 underline">
          Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PhotoGallery images={property.images} altText={property.address} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(property.price, property.status)}
              </p>
              <p className="text-gray-700 mt-1">
                {property.beds} bd | {formatBaths(property.baths)} ba |{' '}
                {property.sqft.toLocaleString()} sqft
              </p>
              <p className="text-gray-500 mt-1">
                {property.address}, {property.city}, {property.state}{' '}
                {property.zip_code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 shrink-0"
            >
              <span>{isFavorited ? '❤️' : '🤍'}</span>
              {isFavorited ? 'Saved' : 'Save'}
            </button>
          </div>

          <hr className="my-6" />

          <h2 className="text-xl font-bold mb-2">About this home</h2>
          <p className="text-gray-700 leading-relaxed">{property.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 text-sm">
            <Info label="Home type" value={HOME_TYPE_LABELS[property.home_type]} />
            <Info label="Year built" value={property.year_built} />
            <Info label="Status" value={property.status === 'for_rent' ? 'For Rent' : 'For Sale'} />
            <Info label="Listed" value={property.listed_date} />
          </div>
        </div>

        <div className="h-72 lg:h-full rounded-lg overflow-hidden border border-gray-200">
          <MapView properties={[property]} />
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
