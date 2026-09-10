import { useState, useEffect } from 'react'
import { FaArrowUp } from 'react-icons/fa6'

/**
 * Back-to-top control.
 *
 * Sits directly ABOVE the questions button. Both were pinned to the same
 * bottom-right corner at right-5 — bottom-6 and bottom-5 — so they rendered on
 * top of each other. The offsets here are derived from the other button's
 * height (56px) plus a 16px gap, so the two stack instead of colliding.
 *
 * Plain CSS transition rather than AnimatePresence — it removes the last
 * framer-motion dependency from the bundle, and a button that fades in does not
 * need an animation library.
 */
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 400)
    toggle()
    window.addEventListener('scroll', toggle, { passive: true })
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  const scrollToTop = () => {
    // Override the smooth scroll-behavior for this jump only; see ScrollReset.
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'smooth'
    window.scrollTo(0, 0)
    html.style.scrollBehavior = previous
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-[5.75rem] right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-brand-400 shadow-lift transition-all duration-300 ease-out hover:bg-ink-800 sm:bottom-[6.5rem] sm:right-6 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <FaArrowUp size={15} aria-hidden="true" />
    </button>
  )
}

export default ScrollToTop
