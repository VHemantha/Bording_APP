import { useState } from 'react'

export default function PhotoGallery({ images, altText }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div>
      <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[activeIndex].image_url}
          alt={altText}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`shrink-0 w-20 h-16 rounded overflow-hidden border-2 ${
                idx === activeIndex ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
