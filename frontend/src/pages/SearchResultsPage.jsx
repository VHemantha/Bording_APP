import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperties } from '../api/properties'
import FilterBar from '../components/FilterBar'
import MapView from '../components/MapView'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'

const DEFAULT_FILTERS = {
  status: 'for_sale',
  min_price: '',
  max_price: '',
  min_beds: '',
  min_baths: '',
  home_type: '',
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [highlightedId, setHighlightedId] = useState(null)

  const filters = useMemo(
    () => ({
      status: searchParams.get('status') || DEFAULT_FILTERS.status,
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      min_beds: searchParams.get('min_beds') || '',
      min_baths: searchParams.get('min_baths') || '',
      home_type: searchParams.get('home_type') || '',
    }),
    [searchParams]
  )
  const search = searchParams.get('search') || ''

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = { ...filters }
    if (search) params.search = search
    Object.keys(params).forEach((key) => {
      if (params[key] === '') delete params[key]
    })

    fetchProperties(params)
      .then(setProperties)
      .catch(() => setError('Unable to load properties right now.'))
      .finally(() => setLoading(false))
  }, [filters, search])

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    fetchFavorites()
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.property.id))))
      .catch(() => setFavoriteIds(new Set()))
  }, [user])

  function updateFilters(nextFilters) {
    const params = new URLSearchParams(searchParams)
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    setSearchParams(params)
  }

  const handleToggleFavorite = useCallback(
    async (property) => {
      if (!user) {
        navigate('/login')
        return
      }
      const isFav = favoriteIds.has(property.id)
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFav) next.delete(property.id)
        else next.add(property.id)
        return next
      })
      try {
        if (isFav) {
          await removeFavorite(property.id)
        } else {
          await addFavorite(property.id)
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (isFav) next.add(property.id)
          else next.delete(property.id)
          return next
        })
      }
    },
    [user, favoriteIds, navigate]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <FilterBar filters={filters} onChange={updateFilters} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-1/2 overflow-y-auto p-4">
          {loading && <p className="text-gray-500">Loading properties...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && properties.length === 0 && (
            <p className="text-gray-500">No properties match your search.</p>
          )}
          {!loading && !error && (
            <p className="text-sm text-gray-500 mb-3">
              {properties.length} results
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorited={favoriteIds.has(property.id)}
                onToggleFavorite={handleToggleFavorite}
                onHover={setHighlightedId}
                highlighted={highlightedId === property.id}
              />
            ))}
          </div>
        </div>
        <div className="hidden md:block md:w-1/2">
          <MapView
            properties={properties}
            highlightedId={highlightedId}
            onMarkerHover={setHighlightedId}
          />
        </div>
      </div>
    </div>
  )
}
