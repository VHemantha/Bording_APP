import { Heart, LayoutDashboard, ListChecks, LogOut, Menu, Plus, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

const LINKS = [
  { to: '/search?status=for_sale', label: 'nav.buy' },
  { to: '/search?status=for_rent', label: 'nav.rent' },
  { to: '/search', label: 'nav.browse' },
]

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { openAuth } = useAuthModal()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function postListing() {
    setMobileOpen(false)
    if (user) navigate('/post')
    else openAuth('login')
  }

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
      {/* Links left, logo centered, account right. Below md: logo left, menu button right. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:grid md:h-20 md:grid-cols-[1fr_auto_1fr]">
        <nav className="hidden items-center gap-6 whitespace-nowrap font-medium text-slate-800 md:flex lg:gap-8">
          {LINKS.map((l) => (
            <NavLink key={l.label} to={l.to} className="transition hover:text-brand-600">
              {t(l.label)}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/saved" className="flex items-center gap-1.5 transition hover:text-brand-600">
              <Heart size={16} /> {t('nav.saved')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="flex items-center gap-1.5 transition hover:text-brand-600">
              <LayoutDashboard size={16} /> {t('nav.admin')}
            </NavLink>
          )}
        </nav>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles size={18} />
          </span>
          <span className="font-display text-2xl font-semibold text-brand-900">Nestwell</span>
        </Link>

        <div className="hidden items-center justify-end gap-4 whitespace-nowrap font-medium text-slate-800 md:flex xl:gap-5">
          <button type="button" onClick={postListing} className="flex items-center gap-1.5 transition hover:text-brand-600">
            <Plus size={17} /> {t('nav.postListing')}
          </button>
          {user && (
            <NavLink to="/my-listings" className="flex items-center gap-1.5 transition hover:text-brand-600">
              <ListChecks size={16} /> {t('nav.myListings')}
            </NavLink>
          )}
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="hidden text-sm font-normal text-slate-500 2xl:inline">
                {t('nav.hi', { name: user.username.split('@')[0] })}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut size={15} /> {t('nav.logOut')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-xl bg-brand-600 px-6 py-2.5 font-bold text-white transition hover:bg-brand-700"
            >
              {t('nav.signIn')}
            </button>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t('nav.menu')}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            {LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)}>
                {t(l.label)}
              </Link>
            ))}
            <button type="button" onClick={postListing} className="text-left">{t('nav.postListing')}</button>
            {user && <Link to="/my-listings" onClick={() => setMobileOpen(false)}>{t('nav.myListings')}</Link>}
            {user && <Link to="/saved" onClick={() => setMobileOpen(false)}>{t('nav.savedHomes')}</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}>{t('nav.adminDashboard')}</Link>}
            <div className="mt-2">
              <LanguageSwitcher inline />
            </div>
            <div className="mt-2 flex gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-200 px-4 py-2"
                >
                  {t('nav.logOut')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    openAuth('login')
                  }}
                  className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white"
                >
                  {t('nav.signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
