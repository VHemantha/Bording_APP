import { Check, ChevronDown, CircleX, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { HOME_TYPE_LABELS, STORIES_LABELS } from '../utils/format'

const STATUSES = [
  ['for_rent', 'For rent'],
  ['for_sale', 'For sale'],
]
const MIN_OPTIONS = ['', '1', '2', '3', '4', '5']

const pill =
  'flex h-12 shrink-0 items-center gap-2 rounded-lg border px-4 font-bold text-brand-900 transition'
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
  const priceActive = filters.min_price || filters.max_price || filters.max_key_money
  const bedsActive = filters.min_beds || filters.min_baths
  const types = csv(filters.home_type)
  const moreCount =
    (filters.min_parking ? 1 : 0) +
    (filters.min_sqft || filters.max_sqft ? 1 : 0) +
    (filters.stories ? 1 : 0)

  return (
    <div className="relative z-30 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <SearchBox key={searchText} initial={searchText} onSearch={onSearch} />

      <Dropdown
        label={STATUSES.find(([v]) => v === filters.status)?.[1] ?? 'For rent'}
        active
      >
        {(close) => (
          <div className="w-48 py-1">
            {STATUSES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onChange({ status: value })
                  close()
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-brand-50 ${
                  filters.status === value ? 'font-bold text-brand-700' : ''
                }`}
              >
                {label}
                {filters.status === value && <Check size={16} />}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Dropdown label="Price" active={Boolean(priceActive)}>
        {(close) => <PricePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={
          bedsActive
            ? [filters.min_beds && `${filters.min_beds}+ bd`, filters.min_baths && `${filters.min_baths}+ ba`]
                .filter(Boolean)
                .join(', ')
            : 'Beds & baths'
        }
        active={Boolean(bedsActive)}
      >
        {(close) => <BedsBathsPanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={types.length ? `Property type (${types.length})` : 'Property type'}
        active={types.length > 0}
      >
        {(close) => <TypePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <Dropdown
        label={moreCount ? `Filters (${moreCount})` : 'Filters'}
        icon={<SlidersHorizontal size={18} />}
        active={moreCount > 0}
        alignRight
      >
        {(close) => <MorePanel filters={filters} onChange={onChange} close={close} />}
      </Dropdown>

      <button
        type="button"
        onClick={onToggleAi}
        aria-pressed={aiOpen}
        className={`${pill} ${aiOpen ? pillActive : pillIdle}`}
      >
        <Sparkles size={18} /> Ask AI
      </button>

      <button
        type="button"
        onClick={onToggleSaved}
        aria-pressed={saved}
        className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-6 font-bold text-white transition hover:bg-brand-700"
      >
        {saved && <Check size={18} />}
        {saved ? 'Search saved' : 'Save search'}
      </button>
    </div>
  )
}

function SearchBox({ initial, onSearch }) {
  const [text, setText] = useState(initial)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(text.trim())
      }}
      className="flex h-12 w-full items-center rounded-lg border border-slate-400 bg-white pl-4 pr-1 transition focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 sm:w-80 lg:w-[26rem]"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter Cities"
        aria-label="Search by city"
        className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-slate-400"
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText('')
            onSearch('')
          }}
          className="rounded-full p-1.5 text-brand-900 transition hover:bg-slate-100"
        >
          <CircleX size={20} className="fill-brand-900 text-white" />
        </button>
      )}
      <button aria-label="Search" className="rounded-lg p-2 text-brand-900 transition hover:bg-slate-100">
        <Search size={22} strokeWidth={2.75} />
      </button>
    </form>
  )
}

function Dropdown({ label, icon, active, alignRight, children }) {
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
    <div ref={ref} className="relative">
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
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
      <button type="button" onClick={onReset} className="text-sm font-bold text-brand-600 hover:underline">
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        Apply
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
    max_key_money: filters.max_key_money,
  })
  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }))

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <form
      className="w-80 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        apply(draft)
      }}
    >
      <p className="mb-2 font-bold">Price range</p>
      <div className="flex items-end gap-2">
        <NumberField label="Minimum" value={draft.min_price} onChange={set('min_price')} placeholder="No min" />
        <span className="pb-3 text-slate-400">–</span>
        <NumberField label="Maximum" value={draft.max_price} onChange={set('max_price')} placeholder="No max" />
      </div>
      <p className="mb-2 mt-4 font-bold">Key money</p>
      <NumberField
        label="Maximum key money"
        value={draft.max_key_money}
        onChange={set('max_key_money')}
        placeholder="Any amount"
      />
      <PanelFooter
        onReset={() => apply({ min_price: '', max_price: '', max_key_money: '' })}
        onApply={() => apply(draft)}
      />
    </form>
  )
}

function MinPicker({ label, value, onChange }) {
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
            className={`flex-1 border-r border-slate-300 px-3 py-2 text-sm font-bold transition last:border-r-0 ${
              value === n ? 'bg-brand-600 text-white' : 'hover:bg-slate-50'
            }`}
          >
            {n ? `${n}+` : 'Any'}
          </button>
        ))}
      </div>
    </div>
  )
}

function BedsBathsPanel({ filters, onChange, close }) {
  const [beds, setBeds] = useState(filters.min_beds)
  const [baths, setBaths] = useState(filters.min_baths)

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <div className="w-80 space-y-4 p-4">
      <MinPicker label="Bedrooms" value={beds} onChange={setBeds} />
      <MinPicker label="Bathrooms" value={baths} onChange={setBaths} />
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

  function apply(list) {
    onChange({ home_type: list.join(',') })
    close()
  }

  return (
    <div className="w-64 p-4">
      <p className="mb-2 font-bold">Property type</p>
      <CheckList
        options={Object.entries(HOME_TYPE_LABELS)}
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

  function apply(values) {
    onChange(values)
    close()
  }

  return (
    <form
      className="w-80 space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        apply({ min_parking: parking, min_sqft: minSqft, max_sqft: maxSqft, stories: stories.join(',') })
      }}
    >
      <MinPicker label="Parking slots" value={parking} onChange={setParking} />
      <div>
        <p className="mb-2 font-bold">Square feet</p>
        <div className="flex items-end gap-2">
          <NumberField label="Minimum" value={minSqft} onChange={setMinSqft} placeholder="No min" />
          <span className="pb-3 text-slate-400">–</span>
          <NumberField label="Maximum" value={maxSqft} onChange={setMaxSqft} placeholder="No max" />
        </div>
      </div>
      <div>
        <p className="mb-2 font-bold">Number of stories</p>
        <CheckList
          options={Object.entries(STORIES_LABELS)}
          selected={stories}
          onToggle={(value) => setStories((list) => toggleIn(list, value))}
        />
      </div>
      <PanelFooter
        onReset={() => apply({ min_parking: '', min_sqft: '', max_sqft: '', stories: '' })}
        onApply={() =>
          apply({ min_parking: parking, min_sqft: minSqft, max_sqft: maxSqft, stories: stories.join(',') })
        }
      />
    </form>
  )
}
