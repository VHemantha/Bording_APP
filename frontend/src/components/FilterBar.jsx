const HOME_TYPES = [
  { value: '', label: 'Any type' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'apartment', label: 'Apartment' },
]

const BEDS_OPTIONS = [0, 1, 2, 3, 4, 5]

const selectClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100'

export default function FilterBar({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
      <select value={filters.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>
        <option value="for_sale">For Sale</option>
        <option value="for_rent">For Rent</option>
      </select>

      <input
        type="number"
        placeholder="Min price"
        value={filters.min_price}
        onChange={(e) => update('min_price', e.target.value)}
        className={`${selectClass} w-28`}
      />
      <input
        type="number"
        placeholder="Max price"
        value={filters.max_price}
        onChange={(e) => update('max_price', e.target.value)}
        className={`${selectClass} w-28`}
      />

      <select value={filters.min_beds} onChange={(e) => update('min_beds', e.target.value)} className={selectClass}>
        <option value="">Any beds</option>
        {BEDS_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}+ beds</option>
        ))}
      </select>

      <select value={filters.min_baths} onChange={(e) => update('min_baths', e.target.value)} className={selectClass}>
        <option value="">Any baths</option>
        {BEDS_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}+ baths</option>
        ))}
      </select>

      <select value={filters.home_type} onChange={(e) => update('home_type', e.target.value)} className={selectClass}>
        {HOME_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  )
}
