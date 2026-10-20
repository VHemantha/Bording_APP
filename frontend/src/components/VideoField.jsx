import { ExternalLink, Play, Video, X } from 'lucide-react'

import { useLanguage } from '../context/LanguageContext'
import { youtubeId } from '../utils/format'

/**
 * The listing form's video tour box. Videos are hosted free on YouTube: the owner uploads
 * there (Unlisted if they prefer) and pastes the link; listings embed it. The site doesn't
 * upload for them: YouTube's upload API makes videos from unverified apps private and allows
 * only a few uploads a day.
 */
export default function VideoField({ value, onChange, error }) {
  const { t } = useLanguage()
  const id = youtubeId(value)
  const invalid = value.trim() && !id

  return (
    <div className="sm:col-span-2">
      {id ? (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-slate-900 sm:w-56"
            aria-label={t('post.videoWatch')}
          >
            <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-lg">
                <Play size={22} fill="currentColor" />
              </span>
            </span>
          </a>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-brand-900">{t('post.videoAdded')}</p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{value}</p>
            <button
              type="button"
              onClick={() => onChange('')}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              <X size={15} /> {t('post.videoRemove')}
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border-2 border-dashed p-5 text-center sm:p-6 ${error || invalid ? 'border-red-300' : 'border-slate-300'}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
            <Video size={24} />
          </span>
          <p className="mt-3 font-bold text-brand-900">{t('post.videoTitle')}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{t('post.videoHelp')}</p>
          <a
            href="https://www.youtube.com/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            {t('post.videoUpload')} <ExternalLink size={15} />
          </a>
          <label className="mx-auto mt-4 block max-w-md text-left">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">{t('post.videoLink')}</span>
            <input
              type="url"
              inputMode="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://youtu.be/..."
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${
                error || invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
              }`}
            />
          </label>
          {(error || invalid) && <p className="mt-1 text-sm text-red-600">{error || t('post.videoInvalid')}</p>}
        </div>
      )}
    </div>
  )
}
