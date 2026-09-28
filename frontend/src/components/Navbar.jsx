import { Heart, LayoutDashboard, LogOut, Menu, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'

const LINKS = [
  { to: '/search?status=for_sale', label: 'Buy' },
  { to: '/search?status=for_rent', label: 'Rent' },
  { to: '/search', label: 'Browse all' },
]

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { openAuth } = useAuthModal()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles size={18} />
          </span>
          <span className="font-display text-xl font-semibold text-brand-900">Nestwell</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `transition hover:text-brand-700 ${isActive ? 'text-brand-700' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/saved" className="flex items-center gap-1.5 transition hover:text-brand-700">
              <Heart size={15} /> Saved
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="flex items-center gap-1.5 transition hover:text-brand-700">
              <LayoutDashboard size={15} /> Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-500">Hi, {user.username.split('@')[0]}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            {LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user && <Link to="/saved" onClick={() => setMobileOpen(false)}>Saved homes</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin dashboard</Link>}
            <div className="mt-2 flex gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 px-4 py-2"
                >
                  Log out
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      openAuth('login')
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      openAuth('register')
                    }}
                    className="rounded-full bg-brand-600 px-4 py-2 font-semibold text-white"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
