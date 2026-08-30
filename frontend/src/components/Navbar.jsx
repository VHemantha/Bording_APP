import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="text-2xl font-bold text-blue-600 shrink-0">
          zillow<span className="text-gray-800">clone</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link to="/search?status=for_sale" className="hover:text-blue-600">
            Buy
          </Link>
          <Link to="/search?status=for_rent" className="hover:text-blue-600">
            Rent
          </Link>
          {user && (
            <Link to="/saved" className="hover:text-blue-600">
              Saved Homes
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                Hi, {user.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium px-3 py-1.5 rounded hover:bg-gray-50"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
