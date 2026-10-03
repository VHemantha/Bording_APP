import { Loader2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { aiErrorMessage, extractListing } from '../../api/ai'
import { useLanguage } from '../../context/LanguageContext'

const SAMPLE = `Charming 3 bed / 2 bath bungalow in East Austin (78702). 1,540 sqft, built 1994.
Updated kitchen with quartz counters, big backyard, detached garage. Asking $529,000.
Photos: https://images.unsplash.com/photo-1568605114967-8130f3a36994`

export default function AdminAIImportPage() {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { t } = useLanguage()

  async function run() {
    if (text.trim().length < 20 || busy) return
    setBusy(true)
    setError(null)
    try {
      const { listing, warnings } = await extractListing(text)
      navigate('/admin/listings/new', { state: { draft: normalise(listing), warnings } })
    } catch (err) {
      setError(aiErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">{t('admin.aiImport')}</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        {t('admin.importBody')}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={t('admin.importPlaceholder')}
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={busy || text.trim().length < 20}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {busy ? t('admin.extracting') : t('admin.extract')}
        </button>
        <button
          onClick={() => setText(SAMPLE)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {t('admin.useSample')}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function normalise(listing = {}) {
  return {
    ...listing,
    latitude: listing.latitude ?? '',
    longitude: listing.longitude ?? '',
    year_built: listing.year_built ?? '',
    primary_image_url: listing.primary_image_url ?? '',
    images: listing.images ?? [],
    listed_date: listing.listed_date || new Date().toISOString().slice(0, 10),
  }
}
