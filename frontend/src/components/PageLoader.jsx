import { Loader2 } from 'lucide-react'

import { useLanguage } from '../context/LanguageContext'

export default function PageLoader({ label }) {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="animate-spin" size={28} />
      <p className="text-sm font-medium">{label ?? t('common.loading')}...</p>
    </div>
  )
}
