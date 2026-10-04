import { LayoutDashboard, List, LogOut, Plus, Wand2 } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import LanguageSwitcher from '../../components/LanguageSwitcher'
import Logo from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const NAV = [
  { to: '/admin', end: true, label: 'admin.dashboard', icon: LayoutDashboard },
  { to: '/admin/listings', label: 'admin.listings', icon: List },
  { to: '/admin/listings/new', label: 'admin.addListing', icon: Plus },
  { to: '/admin/import', label: 'admin.aiImport', icon: Wand2 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between bg-brand-900 p-5 text-white lg:flex">
        <div>
          <Link to="/" className="inline-block rounded-xl bg-white px-3 py-2" aria-label="Rent House.lk">
            <Logo className="h-9" />
          </Link>
          <p className="mt-1 text-xs text-white/50">{t('admin.console')}</p>

          <nav className="mt-8 space-y-1">
            {NAV.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={17} /> {t(label)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-2 text-sm">
          <p className="truncate text-white/60">{user?.email || user?.username}</p>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-white/70 transition hover:bg-white/10"
          >
            <LogOut size={16} /> {t('admin.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-60">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-slate-200 bg-brand-900 px-4 py-3 text-sm text-white lg:hidden">
          {NAV.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 ${isActive ? 'bg-white/15' : 'text-white/70'}`
              }
            >
              {t(label)}
            </NavLink>
          ))}
        </div>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
