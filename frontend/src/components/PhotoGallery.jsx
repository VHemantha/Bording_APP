import { useState } from 'react'

import { mediaUrl } from '../api/client'

export default function PhotoGallery({ images, altText }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="skeleton h-96 w-full rounded-2xl" aria-hidden />
    )
  }

  return (
    <div>
      <div className="h-96 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-soft">
        <img
          src={mediaUrl(images[activeIndex].image_url)}
          alt={altText}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                idx === activeIndex ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={mediaUrl(img.image_url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
