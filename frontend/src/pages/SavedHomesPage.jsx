import { useCallback, useEffect, useState } from 'react'

import { fetchFavorites, removeFavorite } from '../api/auth'
import PropertyCard from '../components/PropertyCard'

export default function SavedHomesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(() => {
    setLoading(true)
    fetchFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false))
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Saved Homes</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && favorites.length === 0 && (
        <p className="text-gray-500">
          You haven't saved any homes yet. Browse listings and tap the heart icon to save them here.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {favorites.map((fav) => (
          <PropertyCard
            key={fav.id}
            property={fav.property}
            isFavorited
            onToggleFavorite={handleUnsave}
          />
        ))}
      </div>
    </div>
  )
}
