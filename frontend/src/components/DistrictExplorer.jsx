import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { districtLabel, fetchLocations } from '../api/locations'
import { useLanguage } from '../context/LanguageContext'

const FLIP_MS = 650
const STAGGER_MS = 28

/**
 * Home page "Explore by district". Every district is a card with its number of ads. Choosing
 * one lifts that card to the top centre and turns every other card over, in a quick wave, to
 * show the district's cities and towns (busiest first); a town opens its search results.
 *
 * Each grid cell is a two-sided card: the front is a district, the back a town of the chosen
 * district. Turning the cells (rather than swapping lists) is what makes the cards "flip".
 */
export default function DistrictExplorer({ deal }) {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [districts, setDistricts] = useState(null)
  const [failed, setFailed] = useState(false)
  const [selectedKey, setSelectedKey] = useState(null)
  // True once the cards have finished turning; then empty cells at the end are removed.
  const [settled, setSettled] = useState(true)
  const sectionRef = useRef(null)

  useEffect(() => {
    let live = true
    setFailed(false)
    fetchLocations(deal)
      .then((list) => live && setDistricts(list))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [deal])

  const selected = districts?.find((d) => d.key === selectedKey) || null
  const cellCount = districts ? Math.max(districts.length, selected?.towns.length ?? 0) : 0

  useEffect(() => {
    setSettled(false)
    const timer = setTimeout(() => setSettled(true), FLIP_MS + cellCount * STAGGER_MS)
    return () => clearTimeout(timer)
  }, [selectedKey, cellCount])

  // Escape goes back to all districts.
  useEffect(() => {
    if (!selectedKey) return
    const onKey = (e) => e.key === 'Escape' && setSelectedKey(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedKey])

  function choose(key) {
    setSelectedKey(key)
    // Keep the lifted card and the first towns in view.
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0 || top > window.innerHeight * 0.4) sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openSearch(params) {
    navigate(`/search?${new URLSearchParams({ status: deal, ...params })}`)
  }

  const ads = (count) => (count === 0 ? t('districts.noAds') : count === 1 ? t('districts.adsOne') : t('districts.ads', { count: count.toLocaleString() }))
  const name = selected ? districtLabel(selected, lang) : ''

  return (
    <section ref={sectionRef} className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-8 pt-16" aria-labelledby="districts-title">
      <h2 id="districts-title" className="text-2xl font-extrabold text-brand-900 sm:text-3xl">
        {selected ? t('districts.townsTitle', { district: name }) : t('districts.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{selected ? t('districts.townsSubtitle') : t('districts.subtitle')}</p>

      {failed && <p className="mt-6 text-sm text-red-600">{t('districts.loadError')}</p>}

      <LayoutGroup>
        <AnimatePresence>
          {selected && (
            <motion.div
              key="selected"
              className="mt-6 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <motion.div
                layoutId={`district-${selected.key}`}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="w-full max-w-xl overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lift sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/75">{t(`province.${selected.province}`)}</p>
                    <p className="mt-1 text-2xl font-extrabold sm:text-3xl">{t('districts.district', { district: name })}</p>
                    <p className="mt-1 font-medium text-white/85">{ads(selected.count)}</p>
                  </div>
                  <MapPin size={28} className="shrink-0 text-white/70" aria-hidden="true" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openSearch({ district: selected.key })}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-bold text-brand-700 shadow transition hover:bg-brand-50"
                  >
                    {t('districts.viewAll', { district: name })} <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(null)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-bold text-white ring-1 ring-white/50 transition hover:bg-white/10"
                  >
                    <ArrowLeft size={18} /> {t('districts.back')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {!districts && !failed && Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton h-28 rounded-2xl sm:h-32" />)}
          {districts &&
            Array.from({ length: cellCount }, (_, i) => {
              const district = districts[i]
              const town = selected?.towns[i]
              const flipped = Boolean(selected)
              const empty = flipped ? !town : !district
              // Cells with nothing on the side now showing fade out, then leave the grid.
              if (empty && settled) return null
              return (
                <div key={i} className={`h-28 [perspective:1200px] sm:h-32 ${empty ? 'pointer-events-none opacity-0 transition-opacity duration-300' : ''}`}>
                  <div
                    className="relative h-full transition-transform ease-[cubic-bezier(.3,.7,.3,1)] [transform-style:preserve-3d]"
                    style={{
                      transform: flipped ? 'rotateY(180deg)' : 'none',
                      transitionDuration: `${FLIP_MS}ms`,
                      transitionDelay: `${i * STAGGER_MS}ms`,
                    }}
                  >
                    {/* Front: a district. */}
                    <div className="absolute inset-0 [backface-visibility:hidden]" inert={flipped || undefined} aria-hidden={flipped || undefined}>
                      {district && district.key !== selectedKey && (
                        <motion.button
                          type="button"
                          layoutId={`district-${district.key}`}
                          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                          onClick={() => choose(district.key)}
                          className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 text-left shadow-soft ring-1 ring-slate-200 transition-shadow hover:shadow-lift hover:ring-brand-300"
                        >
                          <span className="brand-bar" aria-hidden="true" />
                          <span>
                            <span className="block text-base font-extrabold leading-tight text-brand-900 sm:text-lg">{districtLabel(district, lang)}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{t(`province.${district.province}`)}</span>
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${district.count ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                              {ads(district.count)}
                            </span>
                            <ArrowRight size={16} className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:block" aria-hidden="true" />
                          </span>
                        </motion.button>
                      )}
                    </div>

                    {/* Back: a town of the chosen district. */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]" inert={!flipped || undefined} aria-hidden={!flipped || undefined}>
                      {town && (
                        <button
                          type="button"
                          onClick={() => openSearch({ district: selected.key, city: town.name })}
                          className={`group flex h-full w-full flex-col justify-between rounded-2xl p-4 text-left ring-1 transition hover:shadow-lift ${
                            town.count ? 'bg-brand-50 ring-brand-200 hover:ring-brand-400' : 'bg-white ring-slate-200 hover:ring-slate-300'
                          }`}
                        >
                          <span>
                            <span className="block text-base font-extrabold leading-tight text-brand-900 sm:text-lg">{town[lang] || town.name}</span>
                            {town.area && <span className="mt-0.5 block text-xs font-medium text-slate-500">{town.area[lang] || town.area.en}</span>}
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={`whitespace-nowrap text-sm font-bold ${town.count ? 'text-brand-700' : 'text-slate-400'}`}>{ads(town.count)}</span>
                            <ArrowRight size={16} className="hidden shrink-0 text-brand-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:block" aria-hidden="true" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </LayoutGroup>
    </section>
  )
}
