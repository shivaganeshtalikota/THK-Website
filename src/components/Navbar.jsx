import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
// fa6 renames the FA5 icons: FaTimes -> FaXmark, FaTwitter -> FaXTwitter.
import { FaBars, FaXmark, FaInstagram, FaFacebookF, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { nav, social, site } from '../data/site'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter, YouTube: FaYoutube }

/**
 * Mobile panel.
 *
 * Height animated with a CSS grid-template-rows 0fr -> 1fr transition rather
 * than AnimatePresence. It is one line of CSS, needs no JS to settle, and
 * `aria-hidden` plus `inert` keep the collapsed panel out of the tab order.
 */
const MobilePanel = ({ isOpen }) => (
  <div
    id="mobile-menu"
    className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
    }`}
    aria-hidden={!isOpen}
    inert={!isOpen ? '' : undefined}
  >
    <div className="min-h-0 overflow-hidden">
      <ul className="space-y-0.5 border-t border-ink-900/15 py-3">
        {nav.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `block px-4 py-3.5 font-sans text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-900 text-brand-500'
                    : 'text-ink-900/80 hover:bg-ink-900/10 hover:text-ink-900'
                }`
              }
            >
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-2 border-t border-ink-900/15 py-4">
        {social.map((s) => {
          const Glyph = socialIcons[s.name]
          return (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
              className="grid h-11 w-11 place-items-center bg-ink-900/10 text-ink-900 transition-colors hover:bg-ink-900 hover:text-brand-500"
            >
              <Glyph className="text-lg" aria-hidden="true" />
            </a>
          )
        })}
      </div>
    </div>
  </div>
)

/**
 * Header.
 *
 * Solid party yellow, always — not a transparent bar floating over the hero.
 * The transparent treatment made legibility depend on whatever happened to sit
 * in that corner of the photograph, and needed a gradient scrim to paper over
 * it. A solid yellow bar with dark ink on top is unambiguous, reads instantly
 * as TDP, and measures about 13:1.
 */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
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
      className={`fixed inset-x-0 top-0 z-50 bg-brand-500 transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_2px_20px_-6px_rgba(10,10,9,0.35)]' : ''
      }`}
    >
      <nav className="container-custom" aria-label="Primary">
        <div className="flex h-[var(--nav-h)] items-center justify-between gap-4">
          {/* Wordmark. Both names carry equal weight — the surname is not a
              subtitle, and a single rule runs under the whole name. */}
          <Link
            to="/"
            className="group flex shrink-0 items-baseline py-1.5"
            aria-label={`${site.name} — home`}
          >
            <span className="relative font-display text-[1.02rem] font-bold leading-none tracking-tight text-ink-900 sm:text-[1.3rem]">
              Hari Krishna Talikota
              <span
                className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left bg-ink-900 transition-transform duration-300 group-hover:scale-x-105"
                aria-hidden="true"
              />
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
                      'relative py-2 font-sans text-[0.82rem] font-medium transition-colors duration-200',
                      'after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:bg-ink-900',
                      'after:transition-all after:duration-300 hover:text-ink-900',
                      isActive
                        ? 'text-ink-900 after:w-full'
                        : 'text-ink-900/70 after:w-0 hover:after:w-full',
                    ].join(' ')
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <ul className="hidden items-center gap-0.5 md:flex">
              {social.map((s) => {
                const Glyph = socialIcons[s.name]
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
                      className="grid h-9 w-9 place-items-center rounded-sm text-ink-900/70 transition-colors hover:bg-ink-900/10 hover:text-ink-900"
                    >
                      <Glyph className="text-[1rem]" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>

            <Link
              to="/contact"
              className="hidden bg-ink-900 px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ink-800 xl:inline-flex"
            >
              Get Involved
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-sm text-ink-900 transition-colors hover:bg-ink-900/10 lg:hidden"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <FaXmark size={22} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        <MobilePanel isOpen={isOpen} />
      </nav>
    </header>
  )
}

export default Navbar
