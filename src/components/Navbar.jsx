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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out ${
        scrolled
          ? 'border-b border-ink-100 bg-white/85 py-2 shadow-card backdrop-blur-xl'
          : 'border-b border-transparent bg-white py-3.5'
      }`}
    >
      <nav className="container-custom" aria-label="Primary">
        <div className="flex items-center justify-between gap-4">
          {/* Wordmark */}
          <Link to="/" className="group flex shrink-0 items-center gap-3 rounded-xl">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500 font-heading text-base font-extrabold tracking-tight text-ink-900 shadow-sm transition-transform duration-300 group-hover:scale-105"
              aria-hidden="true"
            >
              HK
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate font-heading text-[0.95rem] font-bold leading-tight text-ink-900">
                {site.name}
              </span>
              <span className="block truncate text-[0.7rem] font-medium text-ink-500">
                {site.roleShort}
              </span>
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
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
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
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      <Glyph className="text-[1.05rem]" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>

            <Link to="/contact" className="btn-brand hidden !px-5 !py-2.5 !text-xs xl:inline-flex">
              Get Involved
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-lg text-ink-800 transition-colors hover:bg-ink-50 lg:hidden"
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
