import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
// fa6 renames the FA5 icons: FaTimes -> FaXmark, FaTwitter -> FaXTwitter.
import { FaBars, FaXmark, FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6'
import { nav, social, site } from '../data/site'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter }

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const panelRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    // passive: the old listener forced a main-thread hop on every scroll tick.
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setIsOpen(false), [location])

  // Every route opens on a dark hero that sits *under* the fixed header, so the
  // header starts transparent and solidifies once you scroll past it.
  const overHero = !scrolled && !isOpen
  const onDark = overHero

  // Lock body scroll and wire up Escape while the mobile panel is open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
        overHero
          ? 'on-dark relative isolate border-b border-white/10 bg-transparent py-4'
          : 'border-b border-ink-100 bg-white/90 py-3 backdrop-blur-xl'
      }`}
    >
      {/* Scrim behind the transparent header. Without it the nav sits directly
          on the hero photograph, and whether it is legible depends on what
          happens to be in that corner of the image — here, a bright banner.
          A top-down gradient guarantees a dark ground for the type. */}
      {overHero && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-ink-950/85 via-ink-950/45 to-transparent"
          aria-hidden="true"
        />
      )}

      <nav className="container-custom" aria-label="Primary">
        <div className="flex items-center justify-between gap-4">
          {/* Wordmark — typographic, no monogram tile and no role subtitle.
              The given name carries the weight and the party-yellow rule; the
              surname sits lighter beside it. On narrow screens only the given
              name survives.
              py-1.5 lifts the hit area past the 24px minimum tap target
              (WCAG 2.5.8) — the baseline-aligned text alone measured 23px. */}
          <Link
            to="/"
            className="group flex shrink-0 items-baseline gap-2 rounded-lg py-1.5"
            aria-label={`${site.name} — home`}
          >
            <span
              className={`relative font-display text-[1.15rem] font-bold leading-none tracking-tight transition-colors duration-500 sm:text-[1.4rem] ${
                onDark ? 'text-white' : 'text-ink-900'
              }`}
            >
              Hari Krishna
              <span
                className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left bg-brand-500 transition-transform duration-300 group-hover:scale-x-110"
                aria-hidden="true"
              />
            </span>
            <span
              className={`hidden font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 sm:inline ${
                onDark ? 'text-white/60' : 'text-ink-500'
              }`}
            >
              Talikota
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-7 lg:flex">
            {nav.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    [
                      'nav-link',
                      isActive ? 'nav-link-active' : '',
                      onDark
                        ? 'text-white/75 after:bg-white hover:text-white'
                        : '',
                    ].join(' ')
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ul className="hidden items-center gap-1 md:flex">
              {social.map((s) => {
                const Glyph = socialIcons[s.name]
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
                      className={`grid h-9 w-9 place-items-center rounded-sm transition-colors ${
                        onDark
                          ? 'text-white/60 hover:bg-white/10 hover:text-white'
                          : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                      }`}
                    >
                      <Glyph className="text-[1.05rem]" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>

            <Link
              to="/contact"
              className="btn-brand hidden !px-6 !py-3 !text-[0.7rem] xl:inline-flex"
            >
              Get Involved
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className={`grid h-11 w-11 place-items-center rounded-sm transition-colors lg:hidden ${
                onDark ? 'text-white hover:bg-white/10' : 'text-ink-800 hover:bg-ink-50'
              }`}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <FaXmark size={22} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id="mobile-menu"
              ref={panelRef}
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={reduce ? {} : { opacity: 1, height: 'auto' }}
              exit={reduce ? {} : { opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden lg:hidden"
            >
              <ul className="space-y-1 py-4">
                {nav.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      end={link.path === '/'}
                      className={({ isActive }) =>
                        // Dark ink on yellow. The old active pill was
                        // `bg-tdp-yellow text-white` — white on #FFD700 is
                        // ~1.6:1 and effectively unreadable.
                        `block rounded-xl px-4 py-3 font-heading text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-brand-500 text-ink-900'
                            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-center gap-3 border-t border-ink-100 py-4">
                {social.map((s) => {
                  const Glyph = socialIcons[s.name]
                  return (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
                      className="grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-700 transition-colors hover:bg-brand-500 hover:text-ink-900"
                    >
                      <Glyph className="text-lg" aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

export default Navbar
