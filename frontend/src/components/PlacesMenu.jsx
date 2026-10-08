import { ChevronDown, Loader2, MapPinned } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import useKeepInViewport from './useKeepInViewport'
import { PLACE_CATEGORIES } from './placeCategories'

/**
 * "Nearby places" dropdown laid over a map (top-left, like Zillow's "Schools" menu), with a
 * status line underneath: loading, "zoom in", or a partial-failure notice.
 */
export default function PlacesMenu({ selected, onChange, status }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const panelRef = useRef(null)
  useKeepInViewport(panelRef, open)

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

  function toggle(key) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }

  const notice =
    selected.length === 0
      ? null
      : status === 'zoom'
        ? t('places.zoom')
        : status === 'error' || status === 'partial'
          ? t('places.unavailable')
          : null

  return (
    // z-[1000] sits above the map library's own layers inside the map's stacking context. The
    // wrapper spans the map's width but lets touches through, so only its children catch them.
    <div ref={ref} className="pointer-events-none absolute left-12 right-3 top-3 z-[1000] flex flex-col items-start gap-2 sm:left-14 [&>*]:pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-11 items-center gap-2 rounded-lg border-2 bg-white px-3.5 font-bold text-brand-900 shadow-lift transition ${
          selected.length ? 'border-brand-600' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <MapPinned size={18} />
        {t('places.menu')}
        {selected.length > 0 && (
          <span className="rounded-full bg-brand-600 px-2 text-xs leading-5 text-white">{selected.length}</span>
        )}
        {status === 'loading' ? (
          <Loader2 size={17} className="animate-spin text-brand-600" />
        ) : (
          <ChevronDown size={17} strokeWidth={2.75} className={`transition ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div ref={panelRef} role="dialog" aria-label={t('places.menu')} className="w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lift">
          {PLACE_CATEGORIES.map(({ key, icon: Icon, color }) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggle(key)}
                className="h-4.5 w-4.5 accent-brand-600"
              />
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                <Icon size={15} strokeWidth={2.25} />
              </span>
              <span className="font-medium text-brand-900">{t(`places.${key}`)}</span>
            </label>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-xs text-slate-400">
            <span>{t('places.credit')}</span>
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="font-bold text-brand-600 hover:underline">
                {t('places.clear')}
              </button>
            )}
          </div>
        </div>
      )}

      {notice && !open && (
        <p className="rounded-lg bg-brand-900/85 px-3 py-1.5 text-sm font-medium text-white shadow">{notice}</p>
      )}
    </div>
  )
}
