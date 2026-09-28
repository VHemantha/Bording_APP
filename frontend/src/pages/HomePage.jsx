import { motion } from 'framer-motion'
import { Building2, Heart, KeyRound, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchProperties } from '../api/properties'
import AiSearchBar from '../components/AiSearchBar'
import CountUp from '../components/CountUp'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'
import { useAuthModal } from '../context/AuthModalContext'
import { filtersToSearchParams } from '../utils/searchParams'

const HERO_IMG =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80'

const CITIES = [
  { name: 'Austin', state: 'TX', img: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=800&q=80' },
  { name: 'Seattle', state: 'WA', img: 'https://images.unsplash.com/photo-1438401171849-74ac270044ee?auto=format&fit=crop&w=800&q=80' },
  { name: 'Denver', state: 'CO', img: 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?auto=format&fit=crop&w=800&q=80' },
  { name: 'Raleigh', state: 'NC', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
]

const STEPS = [
  { icon: Sparkles, title: 'Describe it', body: 'Tell our AI what you want in plain words — beds, budget, city, vibe.' },
  { icon: Search, title: 'See real matches', body: 'We translate that into a precise search across every live listing.' },
  { icon: Heart, title: 'Save & tour', body: 'Keep your favorites in one place and reach out when you find the one.' },
]

const TESTIMONIALS = [
  { quote: 'I typed one sentence and got exactly the three condos I ended up touring. Wild.', name: 'Priya M.', role: 'First-time buyer' },
  { quote: 'The assistant answered every "how does this work" question at 11pm. Felt human.', name: 'Marcus T.', role: 'Renter, Seattle' },
  { quote: 'Listing our units through the AI importer cut our admin time in half.', name: 'Dana R.', role: 'Property manager' },
]

export default function HomePage() {
  const [tab, setTab] = useState('for_sale')
  const [mode, setMode] = useState('classic')
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState(null)
  const navigate = useNavigate()
  const { openAuth } = useAuthModal()

  useEffect(() => {
    fetchProperties({ status: 'for_sale' })
      .then((data) => setFeatured(data.slice(0, 8)))
      .catch(() => setFeatured([]))
  }, [])

  function classicSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams({ status: tab })
    if (query.trim()) params.set('search', query.trim())
    navigate(`/search?${params.toString()}`)
  }

  function applyAiFilters(filters) {
    const params = filtersToSearchParams({ status: tab, ...filters })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900/90 via-brand-900/70 to-brand-800/60" />

        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
          >
            <Sparkles size={14} /> AI home search, now built in
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-semibold leading-tight text-white sm:text-6xl"
          >
            Find a home that fits your life
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-4 max-w-xl text-lg text-white/80"
          >
            Search thousands of homes for sale and rent — or just tell our assistant
            what you're picturing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mx-auto mt-9 max-w-2xl"
          >
            <div className="mb-3 flex justify-center gap-1 rounded-full bg-white/10 p-1 text-sm font-medium backdrop-blur">
              {[
                ['for_sale', 'Buy'],
                ['for_rent', 'Rent'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-full px-5 py-1.5 transition ${
                    tab === value ? 'bg-white text-brand-800' : 'text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="mx-1 w-px bg-white/20" />
              {[
                ['classic', 'Search'],
                ['ai', 'Ask AI'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`rounded-full px-5 py-1.5 transition ${
                    mode === value ? 'bg-white text-brand-800' : 'text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'classic' ? (
              <form onSubmit={classicSearch} className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-black/5">
                <Search size={18} className="ml-2 shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, address, or ZIP code"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none sm:text-base"
                />
                <button className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Search
                </button>
              </form>
            ) : (
              <AiSearchBar onApply={applyAiFilters} />
            )}
          </motion.div>
        </div>

        {/* Stat bar */}
        <div className="border-t border-white/10 bg-brand-900/40 backdrop-blur">
          <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-white/10 px-4 py-6 text-center text-white">
            <Stat value={<CountUp to={12000} suffix="+" />} label="Active listings" />
            <Stat value={<CountUp to={48} />} label="Cities covered" />
            <Stat value={<CountUp to={4.9} decimals={1} />} label="Avg. rating" />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
              Featured homes
            </h2>
            <p className="mt-1 text-sm text-slate-500">Fresh listings our buyers are loving right now.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:block"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : featured.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
        </div>
      </section>

      {/* Explore by city */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">Explore by city</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CITIES.map((c, i) => (
            <motion.button
              key={c.name}
              onClick={() => navigate(`/search?city=${encodeURIComponent(c.name)}`)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative h-44 overflow-hidden rounded-2xl text-left"
            >
              <img src={c.img} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <p className="font-display text-lg font-semibold">{c.name}</p>
                <p className="text-xs text-white/70">{c.state}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
          How Nestwell works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon size={20} />
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-brand-900">{s.title}</p>
              <p className="mt-1.5 text-sm text-slate-500">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">Loved by movers</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6"
              >
                <p className="text-sm leading-relaxed text-slate-700">"{t.quote}"</p>
                <footer className="mt-4 text-sm">
                  <span className="font-semibold text-brand-900">{t.name}</span>
                  <span className="text-slate-400"> &middot; {t.role}</span>
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
              <Building2 size={14} /> For agents &amp; managers
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold">List your properties in minutes</h2>
            <p className="mt-3 max-w-md text-white/75">
              Paste your listing notes and let our AI agent structure everything — or
              use the classic form. Admin accounts get a dedicated dashboard.
            </p>
            <button
              onClick={() => openAuth('register')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              <KeyRound size={16} /> Get started
            </button>
          </div>
          <div className="relative hidden md:block">
            <div className="animate-floaty rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">AI import preview</p>
              <p className="mt-2 font-display text-lg">"3BR / 2BA bungalow, 1,540 sqft, $529,000, East Austin, updated kitchen…"</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {['3 beds', '2 baths', '$529,000', 'Austin, TX', 'House'].map((chip) => (
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

function Stat({ value, label }) {
  return (
    <div className="px-2">
      <p className="font-display text-2xl font-semibold sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-white/60 sm:text-sm">{label}</p>
    </div>
  )
}
