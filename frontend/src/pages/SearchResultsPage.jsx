import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperties } from '../api/properties'
import AiSearchBar from '../components/AiSearchBar'
import FilterBar from '../components/FilterBar'
import GoogleMapView from '../components/GoogleMapView'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import { cityName } from '../i18n/translations'
import { filtersToSearchParams } from '../utils/searchParams'

// Every filter the toolbar edits; each is a query-string parameter the API understands.
const FILTER_KEYS = [
  'status',
  'min_price',
  'max_price',
  'max_key_money',
  'min_beds',
  'min_baths',
  'home_type',
  'min_parking',
  'min_sqft',
  'max_sqft',
  'stories',
]
const DEFAULT_STATUS = 'for_rent'

// Labels come from the translations: t(`sort.${key}`).
const SORTS = {
  recommended: null,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  sqft_desc: (a, b) => b.sqft - a.sqft,
  key_money_asc: (a, b) => a.key_money - b.key_money,
}

const SAVED_KEY = 'nestwell.savedSearches'

function readSavedSearches() {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { openAuth } = useAuthModal()
  const { lang, t } = useLanguage()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [highlightedId, setHighlightedId] = useState(null)
  const [aiReply, setAiReply] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [sort, setSort] = useState('recommended')
  const [savedSearches, setSavedSearches] = useState(readSavedSearches)

  const filters = useMemo(() => {
    const values = {}
    FILTER_KEYS.forEach((key) => {
      values[key] = searchParams.get(key) || ''
    })
    values.status ||= DEFAULT_STATUS
    return values
  }, [searchParams])
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
      .catch(() => setError('search.loadError'))
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

  function updateSearch(text) {
    const params = new URLSearchParams(searchParams)
    // Typed text replaces a city chosen from the home page's tiles.
    params.delete('city')
    if (text) params.set('search', text)
    else params.delete('search')
    setSearchParams(params)
  }

  function applyAiFilters(aiFilters, meta) {
    const params = filtersToSearchParams(aiFilters)
    if (!params.get('status')) params.set('status', filters.status)
    setSearchParams(params)
    setAiReply(meta?.reply || null)
  }

  // Saved searches are kept in this browser only (there is no account-side storage for them).
  const searchKey = useMemo(() => {
    const params = new URLSearchParams(searchParams)
    params.sort()
    return params.toString()
  }, [searchParams])
  const isSaved = savedSearches.includes(searchKey)

  function toggleSaved() {
    const next = isSaved ? savedSearches.filter((s) => s !== searchKey) : [...savedSearches, searchKey]
    setSavedSearches(next)
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable (private mode): the button still reflects the choice for this visit.
    }
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

  const sorted = useMemo(() => {
    const compare = SORTS[sort]
    return compare ? [...properties].sort(compare) : properties
  }, [properties, sort])

  const renting = filters.status === 'for_rent'
  const place = cityName(city || search, lang) || t('search.sriLanka')
  const countKey = `search.${renting ? 'rentals' : 'homes'}${properties.length === 1 ? 'One' : 'Other'}`

  return (
    // Fills the screen below the navbar (4rem tall, 5rem from md up). Only the listings
    // column scrolls, so the map stays put.
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-white md:h-[calc(100vh-5rem)]">
      <FilterBar
        filters={filters}
        onChange={updateFilters}
        searchText={city || search}
        onSearch={updateSearch}
        saved={isSaved}
        onToggleSaved={toggleSaved}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((v) => !v)}
      />

      {aiOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <AiSearchBar variant="inline" onApply={applyAiFilters} />
        </div>
      )}

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
            <button onClick={() => setAiReply(null)} aria-label={t('search.dismiss')}>
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1">
        {/* "isolate" keeps the map library's own stacking layers below the toolbar dropdowns. */}
        <div className="isolate hidden md:block md:w-2/5">
          <GoogleMapView
            properties={properties}
            highlightedId={highlightedId}
            onMarkerHover={setHighlightedId}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7">
          <h1 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">
            {t(renting ? 'search.headingRent' : 'search.headingSale', { place })}
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold text-brand-900">
              {loading ? t('search.searching') : t(countKey, { count: properties.length.toLocaleString() })}
            </p>
            <label className="relative flex items-center text-lg font-bold text-brand-600">
              {t('search.sort')}:&nbsp;
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-7 font-bold outline-none [field-sizing:content]"
              >
                {Object.keys(SORTS).map((value) => (
                  <option key={value} value={value}>{t(`sort.${value}`)}</option>
                ))}
              </select>
              <ChevronDown size={20} strokeWidth={2.75} className="pointer-events-none absolute right-0" />
            </label>
          </div>

          <div className="mt-5">
            {loading && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
              </div>
            )}
            {error && <p className="text-red-600">{t(error)}</p>}
            {!loading && !error && properties.length === 0 && (
              <div className="mt-16 text-center">
                <p className="text-lg font-bold text-brand-900">{t('search.emptyTitle')}</p>
                <p className="mt-1 text-sm text-slate-500">{t('search.emptyBody')}</p>
              </div>
            )}
            {!loading && !error && properties.length > 0 && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {sorted.map((property, i) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
