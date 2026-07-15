import { useState, useEffect } from 'react'
import { FaArrowUp } from 'react-icons/fa'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    // pageYOffset is a deprecated alias; scrollY is the modern property.
    // passive listener keeps scrolling off the main thread.
    const toggle = () => setIsVisible(window.scrollY > 400)
    toggle()
    window.addEventListener('scroll', toggle, { passive: true })
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={reduce ? {} : { opacity: 1, scale: 1 }}
          exit={reduce ? {} : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollToTop}
          // Dark ink on yellow — the old button was white on yellow (~1.6:1).
          className="fixed bottom-6 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-brand-400 shadow-lift transition-colors duration-300 hover:bg-ink-800 sm:bottom-8 sm:right-8"
          aria-label="Scroll back to top"
        >
          <FaArrowUp size={16} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTop
