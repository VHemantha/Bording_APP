import { useLayoutEffect } from 'react'

const MARGIN = 8 // px kept clear of the screen edge

/**
 * Keeps an open popover (dropdown panel, menu) fully on screen. It is positioned by CSS as
 * usual; if that would put it past the left or right edge (a button near the edge of a phone
 * screen) it is shifted back in and narrowed if needed, and it is never taller than the space
 * below its top, so on a short screen (phone held sideways) it scrolls inside instead of
 * hiding its Apply button off-screen. The popover needs overflow-y: auto for that.
 */
export default function useKeepInViewport(ref, open) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!open || !el) return

    function fit() {
      el.style.translate = ''
      el.style.maxWidth = `calc(100vw - ${MARGIN * 2}px)`
      el.style.maxHeight = ''
      const rect = el.getBoundingClientRect()
      const room = window.innerHeight - rect.top - MARGIN
      if (rect.bottom > window.innerHeight - MARGIN) el.style.maxHeight = `${Math.max(room, 160)}px`
      const vw = document.documentElement.clientWidth
      let shift = 0
      if (rect.right > vw - MARGIN) shift = vw - MARGIN - rect.right
      if (rect.left + shift < MARGIN) shift = MARGIN - rect.left
      if (shift) el.style.translate = `${Math.round(shift)}px 0`
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [ref, open])
}
