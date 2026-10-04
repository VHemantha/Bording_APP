import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import { CITIES } from '../i18n/translations'

// Phones show this many cities until "Show all" is pressed (54 tiles is a very long scroll).
const PHONE_CITY_LIMIT = 12

const HERO_IMG =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [allCities, setAllCities] = useState(false)
  const navigate = useNavigate()
  const { lang, t } = useLanguage()

  function search(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        {/* Darkens only the left, where the white text sits, so the photo stays bright. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="mx-auto flex min-h-[65vh] max-w-7xl flex-col justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex max-w-3xl gap-5 sm:gap-7"
          >
            <span className="w-1.5 shrink-0 rounded-full bg-white" aria-hidden="true" />
            <div>
              {/* Sinhala and Tamil glyphs are taller and wider than Latin ones, so they get
                  looser line spacing and one size step down. */}
              <h1
                className={`font-display font-semibold text-white drop-shadow-md ${
                  lang === 'en'
                    ? 'text-4xl leading-[1.25] sm:text-6xl lg:text-[4.25rem]'
                    : 'text-3xl leading-[1.3] sm:text-5xl lg:text-6xl'
                }`}
              >
                {t('hero.title')}
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow">{t('hero.subtitle')}</p>
            </div>
          </motion.div>

          <motion.form
            onSubmit={search}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-10 flex h-16 w-full max-w-[37.5rem] items-center rounded-xl border border-slate-300 bg-white pl-5 pr-2 shadow-lift sm:h-[5.5rem] sm:pl-6 sm:pr-3"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('hero.placeholder')}
              aria-label={t('hero.placeholder')}
              className="h-full min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 sm:text-xl"
            />
            <button
              aria-label={t('hero.search')}
              className="shrink-0 rounded-xl p-3 text-brand-900 transition hover:bg-slate-100"
            >
              <Search className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.75} />
            </button>
          </motion.form>
        </div>
      </section>

      {/* Explore by city */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-8">
        <h2 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">{t('cities.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('cities.subtitle')}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {CITIES.map((c, i) => (
            // The reveal animation lives on a wrapper: framer-motion sets an inline transform,
            // which would override the tile's CSS hover lift if both were on the button.
            <motion.div
              key={c.name}
              className={!allCities && i >= PHONE_CITY_LIMIT ? 'hidden sm:block' : ''}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.04 }}
            >
              <button
                type="button"
                onClick={() => navigate(`/search?city=${encodeURIComponent(c.name)}`)}
                className="city-tile"
              >
                {c[lang] || c.name}
              </button>
            </motion.div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAllCities((v) => !v)}
          aria-expanded={allCities}
          className="mt-5 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-brand-900 transition hover:bg-slate-50 sm:hidden"
        >
          {allCities ? t('cities.showLess') : t('cities.showAll', { count: CITIES.length })}
        </button>
      </section>

    </div>
  )
}
