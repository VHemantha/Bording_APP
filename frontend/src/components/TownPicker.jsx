import { Check, ChevronDown, MapPin } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'

/**
 * City / town field for the listing form: a searchable list of the chosen district's towns
 * (matching English, Sinhala and Tamil names and Colombo's area names), that still accepts a
 * town that isn't listed. Replaces a browser <datalist>, which hides the other towns once one
 * is filled in and works poorly on phones.
 */
export default function TownPicker({ label, value, onChange, towns, disabled, placeholder, error, hint }) {
  const { lang, t } = useLanguage()
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(null) // null = show the chosen value, not a search
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const listRef = useRef(null)

  const text = query ?? value
  const options = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase()
    const rows = towns.map((town) => ({
      value: town.name,
      label: town[lang] || town.name,
      // The English name under a Sinhala/Tamil one, and Colombo zones' area names.
      sub: [lang !== 'en' && town[lang] && town[lang] !== town.name ? town.name : '', town.area ? town.area[lang] || town.area.en : '']
        .filter(Boolean)
        .join(' · '),
      search: [town.name, town.si, town.ta, ...(town.area ? Object.values(town.area) : [])].join(' ').toLowerCase(),
    }))
    const matches = q ? rows.filter((row) => row.search.includes(q)) : rows
    const exact = rows.some((row) => row.value.toLowerCase() === q)
    // A town that isn't on the list can still be used as typed.
    return q && !exact ? [...matches, { value: query.trim(), label: t('post.useTyped', { name: query.trim() }), custom: true }] : matches
  }, [towns, query, lang, t])

  useEffect(() => setActive(0), [query, open])

  // Keep the highlighted option in view while moving with the arrow keys.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !wrapRef.current?.contains(e.target) && close()
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  })

  function close() {
    setOpen(false)
    // Leaving the field keeps what was typed.
    if (query !== null && query.trim() && query.trim() !== value) onChange(query.trim())
    setQuery(null)
  }

  function choose(option) {
    onChange(option.value)
    setQuery(null)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      setQuery(null)
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          required
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-9 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
            error ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={label}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronDown size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && !disabled && options.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lift"
        >
          {options.map((option, i) => (
            <li
              key={option.custom ? `custom-${option.value}` : option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={option.value === value}
              // mousedown, so the choice lands before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault()
                choose(option)
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                i === active ? 'bg-brand-50' : ''
              } ${option.custom ? 'border-t border-slate-100 italic text-slate-600' : ''}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-brand-900">{option.label}</span>
                {option.sub && <span className="block truncate text-xs text-slate-500">{option.sub}</span>}
              </span>
              {option.value === value && !option.custom && <Check size={16} className="shrink-0 text-brand-600" />}
            </li>
          ))}
        </ul>
      )}
      {(error || hint) && <span className={`mt-1 block text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || hint}</span>}
    </div>
  )
}
