import { Bookmark, BookmarkCheck, ChevronDown, CircleX, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useLanguage } from '../context/LanguageContext'
import { HOME_TYPE_LABELS, STORIES_LABELS } from '../utils/format'

// Key money options: any, none, or up to N months' rent.
const KEY_MONEY_MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MIN_OPTIONS = ['', '1', '2', '3', '4', '5']

const pill =
  'flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-bold text-brand-900 transition sm:h-12 sm:gap-2 sm:px-4 sm:text-base'
const pillIdle = 'border-slate-400 bg-white hover:bg-slate-50'
const pillActive = 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

const csv = (value) => (value ? value.split(',') : [])

/**
 * Search toolbar: search box, then one dropdown per filter group. Each dropdown edits a
 * draft and only calls `onChange` (a partial filters object) when "Apply" is pressed, so
 * typing a price doesn't refetch on every keystroke.
 */
export default function FilterBar({
  filters,
  onChange,
  searchText,
  onSearch,
  saved,
  onToggleSaved,
  aiOpen,
  onToggleAi,
}) {
  const { t } = useLanguage()
  const priceActive = filters.min_price || filters.max_price || filters.max_key_money_months
  const bedsActive = filters.min_beds || filters.min_baths
  const types = csv(filters.home_type)
  const moreCount =
    (filters.min_parking ? 1 : 0) +
    (filters.min_sqft || filters.max_sqft ? 1 : 0) +
    (filters.stories ? 1 : 0) +
    (filters.furnishing ? 1 : 0)
  const allCount =
    moreCount +
    (filters.min_price || filters.max_price ? 1 : 0) +
    (filters.max_key_money_months ? 1 : 0) +
    (filters.min_beds ? 1 : 0) +
    (filters.min_baths ? 1 : 0) +
    (types.length ? 1 : 0)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="relative z-30 flex flex-wrap items-center gap-2 border-b sm:gap-3 border-slate-200 bg-white px-4 py-2.5">
      <SearchBox key={searchText} initial={searchText} onSearch={onSearch} />

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        className={`${pill} flex-1 justify-center sm:hidden ${allCount ? pillActive : pillIdle}`}
      >
        <SlidersHorizontal size={18} />
        {t('filter.filters')}
        {allCount > 0 && (
          <span className="rounded-full bg-brand-600 px-2 text-xs leading-5 text-white">{allCount}</span>
        )}
      </button>
      {sheetOpen && <AllFiltersSheet filters={filters} onChange={onChange} onClose={() => setSheetOpen(false)} />}

      <Dropdown label={t('filter.price')} active={Boolean(priceActive)} className="hidden sm:block">
        {(close) => <PricePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={
          bedsActive
            ? [filters.min_beds && `${filters.min_beds}+ ${t('unit.bd')}`, filters.min_baths && `${filters.min_baths}+ ${t('unit.ba')}`]
                .filter(Boolean)
                .join(', ')
            : t('filter.bedsBaths')
        }
        active={Boolean(bedsActive)}
        className="hidden sm:block"
      >
        {(close) => <BedsBathsPanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={types.length ? `${t('filter.propertyType')} (${types.length})` : t('filter.propertyType')}
        active={types.length > 0}
        className="hidden sm:block"
      >
        {(close) => <TypePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={moreCount ? `${t('filter.filters')} (${moreCount})` : t('filter.filters')}
        icon={<SlidersHorizontal size={18} />}
        active={moreCount > 0}
        alignRight
        className="hidden sm:block"
      >
        {(close) => <MorePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <button
        type="button"
        onClick={onToggleAi}
        aria-pressed={aiOpen}
        title={t('filter.askAi')}
        className={`${pill} w-11 justify-center px-0 sm:w-auto sm:px-4 ${aiOpen ? pillActive : pillIdle}`}
      >
        <Sparkles size={18} />
        {/* Icon only on phones (the name is still read out); text from sm up. */}
        <span className="sr-only sm:not-sr-only">{t('filter.askAi')}</span>
      </button>

      <button
        type="button"
        onClick={onToggleSaved}
        aria-pressed={saved}
        title={saved ? t('filter.searchSaved') : t('filter.saveSearch')}
        className="flex h-10 w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-bold sm:w-auto sm:px-6 text-white transition hover:bg-brand-700 sm:h-12 sm:px-6 sm:text-base"
      >
        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        <span className="sr-only sm:not-sr-only">{saved ? t('filter.searchSaved') : t('filter.saveSearch')}</span>
      </button>
    </div>
  )
}

function SearchBox({ initial, onSearch }) {
  const [text, setText] = useState(initial)
  const { t } = useLanguage()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(text.trim())
      }}
      className="flex h-11 w-full items-center rounded-lg border border-slate-400 bg-white pl-4 pr-1 sm:h-12 sm:w-80 lg:w-[26rem]"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('hero.placeholder')}
        aria-label={t('filter.searchByCity')}
        className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-slate-400"
      />
      {text && (
        <button
          type="button"
          aria-label={t('filter.clearSearch')}
          onClick={() => {
            setText('')
            onSearch('')
          }}
          className="rounded-full p-1.5 text-brand-900 transition hover:bg-slate-100"
        >
          <CircleX size={20} className="fill-brand-900 text-white" />
        </button>
      )}
      <button aria-label={t('hero.search')} className="rounded-lg p-2 text-brand-900 transition hover:bg-slate-100">
        <Search size={22} strokeWidth={2.75} />
      </button>
    </form>
  )
}

function Dropdown({ label, icon, active, alignRight, className = '', children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${pill} ${active ? pillActive : pillIdle}`}
      >
        {icon}
        {label}
        <ChevronDown size={18} strokeWidth={2.75} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={typeof label === 'string' ? label : undefined}
          className={`absolute top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {/* Mounted only while open, so each panel's draft starts from the applied filters. */}
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function PanelFooter({ onReset, onApply }) {
  const { t } = useLanguage()
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
      <button type="button" onClick={onReset} className="text-sm font-bold text-brand-600 hover:underline">
        {t('common.reset')}
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        {t('common.apply')}
      </button>
    </div>
  )
}

function NumberField({ label, value, onChange, placeholder }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  )
}

function PricePanel({ filters, onChange, close }) {
  const [draft, setDraft] = useState({
    min_price: filters.min_price,
    max_price: filters.max_price,
    max_key_money_months: filters.max_key_money_months,
  })
  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }))
  const { t } = useLanguage()

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <form
      className="w-[23rem] max-w-[calc(100vw-2rem)] p-4"
      onSubmit={(e) => {
        e.preventDefault()
        apply(draft)
      }}
    >
      <p className="mb-2 font-bold">{t('filter.priceRange')}</p>
      <div className="flex items-end gap-2">
        <NumberField label={t('filter.minimum')} value={draft.min_price} onChange={set('min_price')} placeholder={t('filter.noMin')} />
        <span className="pb-3 text-slate-400">–</span>
        <NumberField label={t('filter.maximum')} value={draft.max_price} onChange={set('max_price')} placeholder={t('filter.noMax')} />
      </div>
      <p className="mb-2 mt-4 font-bold">{t('filter.keyMoney')}</p>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-600">{t('filter.maxKeyMoney')}</span>
        <select
          value={draft.max_key_money_months}
          onChange={(e) => set('max_key_money_months')(e.target.value)}
          className={inputClass}
        >
          <option value="">{t('common.any')}</option>
          <option value="0">{t('card.noKeyMoney')}</option>
          {KEY_MONEY_MONTHS.map((n) => (
            <option key={n} value={n}>
              {n === '1' ? t('keyMoney.upToOne') : t('keyMoney.upTo', { count: n })}
            </option>
          ))}
        </select>
      </label>
      <PanelFooter
        onReset={() => apply({ min_price: '', max_price: '', max_key_money_months: '' })}
        onApply={() => apply(draft)}
      />
    </form>
  )
}

function MinPicker({ label, value, onChange }) {
  const { t } = useLanguage()
  return (
    <div>
      <p className="mb-2 font-bold">{label}</p>
      <div className="flex overflow-hidden rounded-lg border border-slate-300">
        {MIN_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex-1 whitespace-nowrap border-r border-slate-300 px-2 py-2 text-sm font-bold transition last:border-r-0 ${
              value === n ? 'bg-brand-600 text-white' : 'hover:bg-slate-50'
            }`}
          >
            {n ? `${n}+` : t('common.any')}
          </button>
        ))}
      </div>
    </div>
  )
}

function BedsBathsPanel({ filters, onChange, close }) {
  const [beds, setBeds] = useState(filters.min_beds)
  const [baths, setBaths] = useState(filters.min_baths)
  const { t } = useLanguage()

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <div className="w-[23rem] max-w-[calc(100vw-2rem)] space-y-4 p-4">
      <MinPicker label={t('filter.bedrooms')} value={beds} onChange={setBeds} />
      <MinPicker label={t('filter.bathrooms')} value={baths} onChange={setBaths} />
      <PanelFooter
        onReset={() => apply({ min_beds: '', min_baths: '' })}
        onApply={() => apply({ min_beds: beds, min_baths: baths })}
      />
    </div>
  )
}

function CheckList({ options, selected, onToggle }) {
  return (
    <div className="space-y-1">
      {options.map(([value, label]) => (
        <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => onToggle(value)}
            className="h-5 w-5 accent-brand-600"
          />
          {label}
        </label>
      ))}
    </div>
  )
}

const toggleIn = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

function TypePanel({ filters, onChange, close }) {
  const [selected, setSelected] = useState(csv(filters.home_type))
  const { t } = useLanguage()

  function apply(list) {
    onChange({ home_type: list.join(',') })
    close()
  }

  return (
    <div className="w-64 p-4">
      <p className="mb-2 font-bold">{t('filter.propertyType')}</p>
      <CheckList
        options={Object.keys(HOME_TYPE_LABELS).map((key) => [key, t(`type.${key}`)])}
        selected={selected}
        onToggle={(value) => setSelected((list) => toggleIn(list, value))}
      />
      <PanelFooter onReset={() => apply([])} onApply={() => apply(selected)} />
    </div>
  )
}

function MorePanel({ filters, onChange, close }) {
  const [parking, setParking] = useState(filters.min_parking)
  const [minSqft, setMinSqft] = useState(filters.min_sqft)
  const [maxSqft, setMaxSqft] = useState(filters.max_sqft)
  const [stories, setStories] = useState(csv(filters.stories))
  const [furnishing, setFurnishing] = useState(csv(filters.furnishing))
  const { t } = useLanguage()

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <form
      className="w-[23rem] max-w-[calc(100vw-2rem)] space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        apply({ min_parking: parking, min_sqft: minSqft, max_sqft: maxSqft, stories: stories.join(','), furnishing: furnishing.join(',') })
      }}
    >
      <MinPicker label={t('filter.parking')} value={parking} onChange={setParking} />
      <div>
        <p className="mb-2 font-bold">{t('filter.sqft')}</p>
        <div className="flex items-end gap-2">
          <NumberField label={t('filter.minimum')} value={minSqft} onChange={setMinSqft} placeholder={t('filter.noMin')} />
          <span className="pb-3 text-slate-400">–</span>
          <NumberField label={t('filter.maximum')} value={maxSqft} onChange={setMaxSqft} placeholder={t('filter.noMax')} />
        </div>
      </div>
      <div>
        <p className="mb-2 font-bold">{t('filter.stories')}</p>
        <CheckList
          options={Object.keys(STORIES_LABELS).map((key) => [key, t(`stories.${key}`)])}
          selected={stories}
          onToggle={(value) => setStories((list) => toggleIn(list, value))}
        />
      </div>
      <div>
        <p className="mb-2 font-bold">{t('filter.furnishing')}</p>
        <CheckList
          options={['furnished', 'unfurnished'].map((key) => [key, t(`furnishing.${key}`)])}
          selected={furnishing}
          onToggle={(value) => setFurnishing((list) => toggleIn(list, value))}
        />
      </div>
      <PanelFooter
        onReset={() => apply({ min_parking: '', min_sqft: '', max_sqft: '', stories: '', furnishing: '' })}
        onApply={() =>
          apply({ min_parking: parking, min_sqft: minSqft, max_sqft: maxSqft, stories: stories.join(','), furnishing: furnishing.join(',') })
        }
      />
    </form>
  )
}

/** Phones: every filter on one full-screen, single-column sheet with one Reset / Apply. */
function AllFiltersSheet({ filters, onChange, onClose }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(() => ({
    min_price: filters.min_price,
    max_price: filters.max_price,
    max_key_money_months: filters.max_key_money_months,
    min_beds: filters.min_beds,
    min_baths: filters.min_baths,
    home_type: csv(filters.home_type),
    min_parking: filters.min_parking,
    min_sqft: filters.min_sqft,
    max_sqft: filters.max_sqft,
    stories: csv(filters.stories),
    furnishing: csv(filters.furnishing),
  }))
  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }))
  const toggle = (field) => (value) => setDraft((d) => ({ ...d, [field]: toggleIn(d[field], value) }))
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // the page behind doesn't scroll
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  function apply(values) {
    onChange({
      ...values,
      home_type: values.home_type.join(','),
      stories: values.stories.join(','),
      furnishing: values.furnishing.join(','),
    })
    onClose()
  }

  function reset() {
    apply({
      min_price: '', max_price: '', max_key_money_months: '', min_beds: '', min_baths: '',
      home_type: [], min_parking: '', min_sqft: '', max_sqft: '', stories: [], furnishing: [],
    })
  }

  // Rendered into <body>: inside the toolbar it would sit under the site header and the
  // assistant button, which are stacked above the toolbar.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-filters-title"
      className="fixed inset-0 z-[110] flex flex-col bg-white sm:hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 id="all-filters-title" className="text-lg font-extrabold text-brand-900">{t('filter.filters')}</h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded-full p-2 text-slate-700 hover:bg-slate-100"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <p className="mb-2 font-bold">{t('filter.priceRange')}</p>
          <div className="flex items-end gap-2">
            <NumberField label={t('filter.minimum')} value={draft.min_price} onChange={set('min_price')} placeholder={t('filter.noMin')} />
            <span className="pb-3 text-slate-400">–</span>
            <NumberField label={t('filter.maximum')} value={draft.max_price} onChange={set('max_price')} placeholder={t('filter.noMax')} />
          </div>
        </section>

        <section>
          <p className="mb-2 font-bold">{t('filter.keyMoney')}</p>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">{t('filter.maxKeyMoney')}</span>
            <select
              value={draft.max_key_money_months}
              onChange={(e) => set('max_key_money_months')(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('common.any')}</option>
              <option value="0">{t('card.noKeyMoney')}</option>
              {KEY_MONEY_MONTHS.map((n) => (
                <option key={n} value={n}>
                  {n === '1' ? t('keyMoney.upToOne') : t('keyMoney.upTo', { count: n })}
                </option>
              ))}
            </select>
          </label>
        </section>

        <MinPicker label={t('filter.bedrooms')} value={draft.min_beds} onChange={set('min_beds')} />
        <MinPicker label={t('filter.bathrooms')} value={draft.min_baths} onChange={set('min_baths')} />

        <section>
          <p className="mb-2 font-bold">{t('filter.propertyType')}</p>
          <CheckList
            options={Object.keys(HOME_TYPE_LABELS).map((key) => [key, t(`type.${key}`)])}
            selected={draft.home_type}
            onToggle={toggle('home_type')}
          />
        </section>

        <MinPicker label={t('filter.parking')} value={draft.min_parking} onChange={set('min_parking')} />

        <section>
          <p className="mb-2 font-bold">{t('filter.sqft')}</p>
          <div className="flex items-end gap-2">
            <NumberField label={t('filter.minimum')} value={draft.min_sqft} onChange={set('min_sqft')} placeholder={t('filter.noMin')} />
            <span className="pb-3 text-slate-400">–</span>
            <NumberField label={t('filter.maximum')} value={draft.max_sqft} onChange={set('max_sqft')} placeholder={t('filter.noMax')} />
          </div>
        </section>

        <section>
          <p className="mb-2 font-bold">{t('filter.stories')}</p>
          <CheckList
            options={Object.keys(STORIES_LABELS).map((key) => [key, t(`stories.${key}`)])}
            selected={draft.stories}
            onToggle={toggle('stories')}
          />
        </section>

        <section>
          <p className="mb-2 font-bold">{t('filter.furnishing')}</p>
          <CheckList
            options={['furnished', 'unfurnished'].map((key) => [key, t(`furnishing.${key}`)])}
            selected={draft.furnishing}
            onToggle={toggle('furnishing')}
          />
        </section>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={reset}
          className="h-12 rounded-lg border border-slate-300 px-5 font-bold text-brand-900 hover:bg-slate-50"
        >
          {t('common.reset')}
        </button>
        <button
          type="button"
          onClick={() => apply(draft)}
          className="h-12 flex-1 rounded-lg bg-brand-600 font-bold text-white transition hover:bg-brand-700"
        >
          {t('filter.showResults')}
        </button>
      </div>
    </div>,
    document.body
  )
}
