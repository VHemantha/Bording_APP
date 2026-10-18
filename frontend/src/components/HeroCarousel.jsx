import { useEffect, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import commercial from '../assets/hero/4-commercial.webp'
import houseBungalow from '../assets/hero/2-house-bungalow.webp'
import houseModern from '../assets/hero/1-house-modern.webp'
import houseTwoStory from '../assets/hero/3-house-two-story.webp'
import landCoconut from '../assets/hero/5-land-coconut.webp'
import landPlots from '../assets/hero/6-land-plots.webp'

const SLIDES = [houseModern, houseBungalow, houseTwoStory, commercial, landCoconut, landPlots]
const INTERVAL_MS = 6000

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * The home page hero's background: Sri Lankan homes, shops and land, cross-fading every few
 * seconds with a slow zoom. Decorative (the photos have empty alt text); the dots let people
 * pick a photo, and hovering or focusing them pauses the show. People who ask their OS for
 * less motion get no auto-advance and no zoom.
 */
export default function HeroCarousel() {
  const { t } = useLanguage()
  const [current, setCurrent] = useState(0)
  // Photos are added to the page one step ahead of being shown, so only the first one is
  // downloaded with the page and the rest arrive while the previous slide is on screen.
  const [loadedUpTo, setLoadedUpTo] = useState(1)
  const [paused, setPaused] = useState(false)
  const [still] = useState(prefersReducedMotion)

  useEffect(() => {
    if (paused || still) return
    const timer = setTimeout(() => setCurrent((i) => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [current, paused, still])

  useEffect(() => {
    setLoadedUpTo((n) => Math.max(n, Math.min(current + 1, SLIDES.length - 1)))
  }, [current])

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden bg-brand-900" aria-hidden="true">
        {SLIDES.slice(0, loadedUpTo + 1).map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            fetchPriority={i === 0 ? 'high' : 'low'}
            className={`hero-slide absolute inset-0 h-full w-full object-cover ${i === current ? 'is-current' : ''} ${
              still ? 'is-still' : ''
            }`}
          />
        ))}
      </div>

      <div
        className="absolute bottom-4 right-4 z-10 flex gap-1.5 sm:bottom-6 sm:right-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={t('hero.photo', { n: i + 1, total: SLIDES.length })}
            aria-current={i === current}
            // A 24 px tap target around a small visible dot; the current one stretches into a pill.
            className="group flex h-6 items-center"
          >
            <span
              className={`block h-2 rounded-full shadow transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/55 group-hover:bg-white/85'
              }`}
            />
          </button>
        ))}
      </div>
    </>
  )
}
