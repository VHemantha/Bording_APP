import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { fetchProperties } from '../api/properties'
import PropertyCard from '../components/PropertyCard'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchProperties({ status: 'for_sale' })
      .then((data) => setFeatured(data.slice(0, 8)))
      .catch(() => setFeatured([]))
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">Find your next home</h1>
        <p className="text-blue-100 mb-8">
          Search homes for sale and rent across the country
        </p>
        <form
          onSubmit={handleSearch}
          className="max-w-xl mx-auto flex bg-white rounded-lg overflow-hidden shadow-lg"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a city, address, or ZIP code"
            className="flex-1 px-4 py-3 text-gray-900 outline-none"
          />
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6"
          >
            Search
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Link to="/search?status=for_sale" className="underline">
            Browse homes for sale
          </Link>
          <Link to="/search?status=for_rent" className="underline">
            Browse rentals
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Featured homes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  )
}
