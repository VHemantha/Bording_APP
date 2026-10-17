import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import Logo, { APP_NAME } from './Logo'

const COLUMNS = [
  { title: 'footer.explore', links: [['nav.browse', '/search'], ['nav.postListing', '/post']] },
  { title: 'footer.company', links: [['footer.about', '/about']] },
  { title: 'footer.support', links: [['footer.contact', '/about#contact'], ['footer.privacy', '/privacy']] },
]

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 text-center md:grid-cols-[1.4fr_repeat(3,1fr)] md:text-left">
          <div>
            <Link to="/" aria-label={APP_NAME} className="inline-block">
              <Logo className="h-16" />
            </Link>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-brand-900">{t(col.title)}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="transition hover:text-brand-700">{t(label)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-500 md:text-left">
          © {new Date().getFullYear()} {APP_NAME}.
        </p>
      </div>
    </footer>
  )
}
