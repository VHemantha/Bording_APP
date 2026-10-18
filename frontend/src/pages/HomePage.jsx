import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import DealToggle from '../components/DealToggle'
import DistrictExplorer from '../components/DistrictExplorer'
import HeroCarousel from '../components/HeroCarousel'
import { useDeal } from '../context/DealContext'
import { useLanguage } from '../context/LanguageContext'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { lang, t } = useLanguage()
  const { deal, setDeal } = useDeal()
  const selling = deal === 'for_sale'

  function search(e) {
    e.preventDefault()
    const params = new URLSearchParams({ status: deal })
    if (query.trim()) params.set('search', query.trim())
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <HeroCarousel />
        {/* Darkens only the left, where the white text sits, so the photo stays bright. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        {/* Phones: the text spans the whole width, so the photo is dimmed evenly as well. */}
        <div className="absolute inset-0 -z-10 bg-black/25 sm:hidden" />

        <div className="mx-auto flex min-h-[65vh] max-w-7xl flex-col justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex max-w-4xl gap-5 sm:gap-7"
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
                {/* Two lines, broken after the comma (the translations contain a line break). */}
                <span className="whitespace-pre-line">{t('hero.tagline')}</span>
              </h1>
            </div>
          </motion.div>

          {/* Sale or Rent: switches the whole site (search results, filters, prices). */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-10 w-full max-w-[37.5rem]"
          >
            <DealToggle value={deal} onChange={setDeal} variant="hero" className="w-full sm:w-auto" />
          </motion.div>

          <motion.form
            onSubmit={search}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-3 flex h-16 w-full max-w-[37.5rem] items-center rounded-xl border border-slate-300 bg-white pl-5 pr-2 shadow-lift sm:h-[5.5rem] sm:pl-6 sm:pr-3"
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

      <DistrictExplorer deal={deal} />

    </div>
  )
}
