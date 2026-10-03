import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { mediaUrl } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

/**
 * Zillow-style photo header: one large photo on the left and up to four on the right, with
 * "See all N photos" opening a full-screen viewer (arrow keys / Esc work there).
 */
export default function PhotoCollage({ photos, alt }) {
  const { t } = useLanguage()
  const [viewing, setViewing] = useState(null) // index of the photo open in the viewer

  if (photos.length === 0) return <div className="skeleton h-80 rounded-2xl sm:h-[28rem]" aria-hidden />

  const side = photos.slice(1, 5)

  return (
    <>
      <div
        className={`relative grid h-72 gap-2 overflow-hidden rounded-2xl sm:h-[28rem] ${
          side.length ? 'sm:grid-cols-2' : ''
        }`}
      >
        <Tile src={photos[0]} alt={alt} onClick={() => setViewing(0)} />
        {side.length > 0 && (
          <div className={`hidden gap-2 sm:grid ${side.length > 1 ? 'grid-cols-2' : ''} ${side.length > 2 ? 'grid-rows-2' : ''}`}>
            {side.map((src, i) => (
              <Tile
                key={src + i}
                src={src}
                alt=""
                onClick={() => setViewing(i + 1)}
                // With three side photos, the last one spans the bottom row.
                className={side.length === 3 && i === 2 ? 'col-span-2' : ''}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setViewing(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-bold text-brand-900 shadow-lift transition hover:bg-slate-50"
        >
          <LayoutGrid size={16} /> {t('detail.seeAllPhotos', { count: photos.length })}
        </button>
      </div>

      {viewing !== null && (
        <Lightbox photos={photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </>
  )
}

function Tile({ src, alt, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`group h-full min-h-0 overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={mediaUrl(src)}
        alt={alt}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </button>
  )
}

function Lightbox({ photos, index, onIndex, onClose }) {
  const { t } = useLanguage()
  const step = useCallback(
    (delta) => onIndex((index + delta + photos.length) % photos.length),
    [index, onIndex, photos.length]
  )

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // keep the page behind from scrolling
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose, step])

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-white/80">{t('detail.photoOf', { n: index + 1, total: photos.length })}</p>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded-full p-2 hover:bg-white/10">
          <X size={24} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-14">
        <img src={mediaUrl(photos[index])} alt="" className="max-h-full max-w-full object-contain" />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t('detail.previousPhoto')}
              className="absolute left-3 rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t('detail.nextPhoto')}
              className="absolute right-3 rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {photos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => onIndex(i)}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
              i === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
