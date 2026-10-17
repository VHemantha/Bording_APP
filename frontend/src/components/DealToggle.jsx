import { KeyRound, Tag } from 'lucide-react'

import { useLanguage } from '../context/LanguageContext'

const OPTIONS = [
  ['for_sale', 'deal.sale', Tag],
  ['for_rent', 'deal.rent', KeyRound],
]

const VARIANTS = {
  // On the home page photo: frosted glass track, the chosen side in solid white.
  hero: {
    track: 'bg-white/15 p-1 ring-1 ring-white/40 backdrop-blur-md',
    button: 'h-11 px-6 text-base sm:h-12 sm:px-8 sm:text-lg',
    on: 'bg-white text-brand-700 shadow-md',
    off: 'text-white hover:bg-white/15',
  },
  // In toolbars and forms: light track, the chosen side in the brand colour.
  bar: {
    track: 'bg-slate-100 p-1 ring-1 ring-slate-300',
    button: 'h-8 px-3 text-sm sm:h-10 sm:px-4 sm:text-base',
    on: 'bg-brand-600 text-white shadow-sm',
    off: 'text-brand-900 hover:bg-white',
  },
}

/** The "Sale | Rent" switch. `value` is 'for_sale' or 'for_rent'. */
export default function DealToggle({ value, onChange, variant = 'bar', className = '' }) {
  const { t } = useLanguage()
  const style = VARIANTS[variant]

  return (
    <div role="group" aria-label={t('deal.label')} className={`inline-flex shrink-0 rounded-xl ${style.track} ${className}`}>
      {OPTIONS.map(([key, label, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold transition ${style.button} ${
            value === key ? style.on : style.off
          }`}
        >
          <Icon size={variant === 'hero' ? 18 : 16} strokeWidth={2.5} aria-hidden="true" />
          {t(label)}
        </button>
      ))}
    </div>
  )
}
