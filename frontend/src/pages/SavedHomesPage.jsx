import { HeartOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchFavorites, removeFavorite } from '../api/auth'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'

export default function SavedHomesPage() {
  const [favorites, setFavorites] = useState(null)

  const loadFavorites = useCallback(() => {
    fetchFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]))
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  async function handleUnsave(property) {
    setFavorites((prev) => prev.filter((f) => f.property.id !== property.id))
    try {
      await removeFavorite(property.id)
    } catch {
      loadFavorites()
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900">Saved homes</h1>
      <p className="mt-1 text-sm text-slate-500">The homes you've hearted, all in one place.</p>

      <div className="mt-8">
        {favorites === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <HeartOff className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 font-display text-lg font-semibold text-brand-900">Nothing saved yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse listings and tap the heart to keep them here.
            </p>
            <Link
              to="/search"
              className="mt-5 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Browse homes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((fav, i) => (
              <PropertyCard
                key={fav.id}
                property={fav.property}
                index={i}
                isFavorited
                onToggleFavorite={handleUnsave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
