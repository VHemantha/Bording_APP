import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'

const COLUMNS = [
  { title: 'footer.explore', links: [['nav.buy', '/search?status=for_sale'], ['nav.rent', '/search?status=for_rent'], ['nav.browse', '/search']] },
  { title: 'footer.company', links: [['footer.about', '/'], ['footer.careers', '/'], ['footer.press', '/']] },
  { title: 'footer.support', links: [['footer.help', '/'], ['footer.contact', '/'], ['footer.privacy', '/']] },
]

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Sparkles size={18} />
              </span>
              <span className="font-display text-xl font-semibold text-brand-900">Nestwell</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">{t('footer.tagline')}</p>
            <form
              className="mt-5 flex max-w-sm items-center gap-2 rounded-lg border border-slate-300 p-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                aria-label={t('footer.emailPlaceholder')}
                placeholder={t('footer.emailPlaceholder')}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
                {t('footer.subscribe')}
              </button>
            </form>
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
        <p className="mt-12 border-t border-slate-100 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Nestwell. {t('footer.copyright')}
        </p>
      </div>
    </footer>
  )
}
