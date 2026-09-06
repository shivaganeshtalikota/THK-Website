import { useState, useEffect } from 'react'
import { FaArrowUp } from 'react-icons/fa6'

/**
 * Back-to-top control. Plain CSS transition rather than AnimatePresence — it
 * removes the last framer-motion dependency from the bundle, and a button that
 * fades in does not need an animation library.
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
      className={`fixed bottom-6 right-5 z-40 grid h-12 w-12 place-items-center bg-ink-900 text-brand-400 shadow-lift transition-all duration-300 ease-out hover:bg-ink-800 sm:bottom-8 sm:right-8 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <FaArrowUp size={15} aria-hidden="true" />
    </button>
  )
}

export default ScrollToTop
