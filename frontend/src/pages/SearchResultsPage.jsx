import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperties } from '../api/properties'
import AiSearchBar from '../components/AiSearchBar'
import FilterBar from '../components/FilterBar'
import MapView from '../components/MapView'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { filtersToSearchParams } from '../utils/searchParams'

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
  const { openAuth } = useAuthModal()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [highlightedId, setHighlightedId] = useState(null)
  const [aiReply, setAiReply] = useState(null)

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
  const city = searchParams.get('city') || ''

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = { ...filters }
    if (search) params.search = search
    if (city) params.city = city
    Object.keys(params).forEach((key) => {
      if (params[key] === '') delete params[key]
    })

    fetchProperties(params)
      .then(setProperties)
      .catch(() => setError('Unable to load properties right now.'))
      .finally(() => setLoading(false))
  }, [filters, search, city])

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
      if (value === '' || value === undefined || value === null) params.delete(key)
      else params.set(key, value)
    })
    setSearchParams(params)
  }

  function applyAiFilters(aiFilters, meta) {
    const params = filtersToSearchParams(aiFilters)
    if (!params.get('status')) params.set('status', filters.status)
    setSearchParams(params)
    setAiReply(meta?.reply || null)
  }

  const handleToggleFavorite = useCallback(
    async (property) => {
      if (!user) {
        openAuth('login')
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
        if (isFav) await removeFavorite(property.id)
        else await addFavorite(property.id)
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (isFav) next.add(property.id)
          else next.delete(property.id)
          return next
        })
      }
    },
    [user, favoriteIds, openAuth]
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <AiSearchBar variant="inline" onApply={applyAiFilters} />
      </div>
      <FilterBar filters={filters} onChange={updateFilters} />

      <AnimatePresence>
        {aiReply && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-brand-50 px-4 py-2.5 text-sm text-brand-800"
          >
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{aiReply}</p>
            <button onClick={() => setAiReply(null)} aria-label="Dismiss">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full overflow-y-auto p-4 md:w-1/2">
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && properties.length === 0 && (
            <div className="mt-16 text-center">
              <p className="font-display text-lg font-semibold text-brand-900">No homes match yet</p>
              <p className="mt-1 text-sm text-slate-500">Try widening your price range or removing a filter.</p>
            </div>
          )}
          {!loading && !error && properties.length > 0 && (
            <>
              <p className="mb-3 text-sm text-slate-500">{properties.length} results</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {properties.map((property, i) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    index={i}
                    isFavorited={favoriteIds.has(property.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onHover={setHighlightedId}
                    highlighted={highlightedId === property.id}
                  />
                ))}
              </div>
            </>
          )}
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
