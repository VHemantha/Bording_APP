import { motion } from 'framer-motion'
import { Building2, Heart, KeyRound, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import { CITIES } from '../i18n/translations'

const HERO_IMG =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80'

const STEPS = [
  { icon: Sparkles, key: 'how.step1' },
  { icon: Search, key: 'how.step2' },
  { icon: Heart, key: 'how.step3' },
]

const TESTIMONIALS = [
  { key: 'testimonials.1', name: 'Priya M.' },
  { key: 'testimonials.2', name: 'Marcus T.' },
  { key: 'testimonials.3', name: 'Dana R.' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { openAuth } = useAuthModal()
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

        <div className="mx-auto flex min-h-[28rem] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[34rem] lg:min-h-[38rem]">
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
                    ? 'text-4xl leading-[1.05] sm:text-6xl lg:text-7xl'
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
            className="mt-10 flex h-16 w-full max-w-[46rem] items-center rounded-2xl border border-slate-300 bg-white pl-5 pr-2 shadow-lift transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/25 sm:h-[5.5rem] sm:pl-7 sm:pr-4"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('hero.placeholder')}
              aria-label={t('hero.placeholder')}
              className="h-full min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 sm:text-2xl"
            />
            <button
              aria-label={t('hero.search')}
              className="shrink-0 rounded-xl p-3 text-brand-900 transition hover:bg-slate-100"
            >
              <Search className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.75} />
            </button>
          </motion.form>
        </div>
      </section>

      {/* Explore by city */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-8">
        <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">{t('cities.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('cities.subtitle')}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {CITIES.map((c, i) => (
            // The reveal animation lives on a wrapper: framer-motion sets an inline transform,
            // which would override the tile's CSS hover lift if both were on the button.
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 5) * 0.05 }}
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
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
          {t('how.title')}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon size={20} />
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-brand-900">{t(`${s.key}.title`)}</p>
              <p className="mt-1.5 text-sm text-slate-500">{t(`${s.key}.body`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">{t('testimonials.title')}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((item, i) => (
              <motion.blockquote
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6"
              >
                <p className="text-sm leading-relaxed text-slate-700">"{t(`${item.key}.quote`)}"</p>
                <footer className="mt-4 text-sm">
                  <span className="font-semibold text-brand-900">{item.name}</span>
                  <span className="text-slate-400"> &middot; {t(`${item.key}.role`)}</span>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-brand-900 p-10 text-white md:grid-cols-2 md:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Building2 size={14} /> {t('cta.badge')}
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold">{t('cta.title')}</h2>
            <p className="mt-3 max-w-md text-white/75">{t('cta.body')}</p>
            <button
              onClick={() => openAuth('register')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              <KeyRound size={16} /> {t('cta.button')}
            </button>
          </div>
          <div className="relative hidden md:block">
            <div className="animate-floaty rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">{t('cta.previewLabel')}</p>
              {/* The sample notes stay in English: they stand for what an agent would paste. */}
              <p className="mt-2 font-display text-lg" lang="en">{t('cta.previewText')}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {[t('cta.chip.beds'), t('cta.chip.baths'), '$529,000', t('cta.chip.city'), t('cta.chip.type')].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/15 px-2.5 py-1">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
