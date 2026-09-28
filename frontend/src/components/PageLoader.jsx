import { Loader2 } from 'lucide-react'

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="animate-spin" size={28} />
      <p className="text-sm font-medium">{label}...</p>
    </div>
  )
}
