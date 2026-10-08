import { Heart, LayoutDashboard, ListChecks, LogOut, Menu, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'

const linkClass = 'flex items-center gap-1.5 transition hover:text-brand-600'

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
      {/* Logo on the left, account actions on the right. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-20">
        <Link to="/" className="min-w-0 shrink" aria-label="Rent House.lk">
          <Logo className="h-9 max-w-full min-[380px]:h-10 md:h-12" />
        </Link>

        <nav
          aria-label={t('a11y.mainMenu')}
          className="hidden items-center justify-end gap-4 whitespace-nowrap font-medium text-slate-800 md:flex xl:gap-6"
        >
          <button type="button" onClick={postListing} className={linkClass}>
            <Plus size={17} /> {t('nav.postListing')}
          </button>
          {user && (
            <NavLink to="/my-listings" className={linkClass}>
              <ListChecks size={16} /> {t('nav.myListings')}
            </NavLink>
          )}
          {user && (
            <NavLink to="/saved" className={linkClass}>
              <Heart size={16} /> {t('nav.saved')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <LayoutDashboard size={16} /> {t('nav.admin')}
            </NavLink>
          )}
          <LanguageSwitcher />
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={15} /> {t('nav.logOut')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-lg bg-brand-600 px-6 py-2.5 font-bold text-white transition hover:bg-brand-700"
            >
              {t('nav.signIn')}
            </button>
          )}
        </nav>

        {/* Phones: the language picker stays in the bar, outside the collapsible menu. */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t('nav.menu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1 font-medium text-slate-800">
            <button type="button" onClick={postListing} className="rounded-lg px-2 py-2.5 text-left hover:bg-slate-50">
              {t('nav.postListing')}
            </button>
            {user && (
              <Link to="/my-listings" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-slate-50">
                {t('nav.myListings')}
              </Link>
            )}
            {user && (
              <Link to="/saved" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-slate-50">
                {t('nav.savedHomes')}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-slate-50">
                {t('nav.adminDashboard')}
              </Link>
            )}
            <div className="mt-3">
              {user ? (
                <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-300 px-4 py-2.5">
                  {t('nav.logOut')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    openAuth('login')
                  }}
                  className="rounded-lg bg-brand-600 px-5 py-2.5 font-bold text-white"
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
