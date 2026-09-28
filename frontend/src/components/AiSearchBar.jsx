import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { aiErrorMessage, searchWithAI } from '../api/ai'

const SUGGESTIONS = [
  '3 bed house in Austin under $600k',
  'Pet-friendly rentals in Seattle',
  'Condos in Denver with 2+ baths',
]

/**
 * Natural-language search box. On success it calls `onApply(filters, meta)` where
 * meta = { reply, count }. The parent turns `filters` into the existing search
 * query params, so all result rendering is reused.
 */
export default function AiSearchBar({ onApply, variant = 'hero', className = '' }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function run(q) {
    const text = (q ?? query).trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      const data = await searchWithAI(text)
      onApply(data.filters || {}, { reply: data.reply, count: data.count, query: text })
    } catch (err) {
      setError(aiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const hero = variant === 'hero'

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className={`flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lift ${
          hero ? 'ring-1 ring-black/5' : 'border border-slate-200'
        }`}
      >
        <span className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Sparkles size={18} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your ideal home in plain English"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none sm:text-base"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? 'Thinking' : 'Ask AI'}
        </button>
      </form>

      {hero && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s)
                run(s)
              }}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-2 rounded-lg px-3 py-2 text-sm ${
            hero ? 'bg-white/90 text-red-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
