import { Check, ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

/** Globe dropdown (navbar) or, with `inline`, a row of buttons (mobile menu). */
export default function LanguageSwitcher({ inline = false, onChange }) {
  const { lang, setLang, t } = useLanguage()
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

  function choose(code) {
    setLang(code)
    setOpen(false)
    onChange?.(code)
  }

  if (inline) {
    return (
      <div className="flex gap-2" role="group" aria-label={t('nav.language')}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => choose(l.code)}
            aria-pressed={lang === l.code}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              lang === l.code
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 text-slate-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    )
  }

  const current = LANGUAGES.find((l) => l.code === lang)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.language')}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Globe size={16} />
        <span lang={current.code}>{current.label}</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === l.code}
              lang={l.code}
              onClick={() => choose(l.code)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-brand-50 ${
                lang === l.code ? 'font-semibold text-brand-700' : 'text-slate-700'
              }`}
            >
              {l.label}
              {lang === l.code && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
