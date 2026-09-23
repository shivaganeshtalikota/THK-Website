import { useCallback, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  FaGaugeHigh,
  FaImages,
  FaWandMagicSparkles,
  FaNewspaper,
  FaCalendarDays,
  FaBullhorn,
  FaAddressCard,
  FaLanguage,
  FaClockRotateLeft,
  FaShieldHalved,
  FaBars,
  FaXmark,
  FaArrowUpRightFromSquare,
  FaRightFromBracket,
  FaPlus,
} from 'react-icons/fa6'
import { api } from './api'
import { ContentContext, SITE } from './content'
import Overview from './pages/Overview'
import Posters from './pages/Posters'
import PosterEditor from './pages/PosterEditor'
import Gallery from './pages/Gallery'
import Updates from './pages/Updates'
import Events from './pages/Events'
import Announcement from './pages/Announcement'
import ContactSocial from './pages/ContactSocial'
import PageText from './pages/PageText'
import Activity from './pages/Activity'
import Security from './pages/Security'


const NAV = [
  { group: 'Campaigns' },
  { to: '/', label: 'Overview', icon: FaGaugeHigh, end: true },
  { to: '/posters', label: 'Posters', icon: FaWandMagicSparkles },
  { group: 'Website' },
  { to: '/gallery', label: 'Photo gallery', icon: FaImages },
  { to: '/updates', label: 'News & updates', icon: FaNewspaper },
  { to: '/events', label: 'Events & programmes', icon: FaCalendarDays },
  { to: '/announcement', label: 'Announcement bar', icon: FaBullhorn },
  { to: '/contact', label: 'Contact & social', icon: FaAddressCard },
  { to: '/text', label: 'Page text', icon: FaLanguage },
  { group: 'Account' },
  { to: '/activity', label: 'Activity log', icon: FaClockRotateLeft },
  { to: '/security', label: 'Security', icon: FaShieldHalved },
]

function Sidebar({ onNavigate, onSignOut }) {
  return (
    <nav className="flex h-full flex-col bg-ink-950 text-white" aria-label="Console">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <img src="/tdp-emblem.png" alt="" className="h-10 w-10 rounded-lg" />
        <div className="leading-tight">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-400">Office Console</p>
          <p className="font-display text-[1.05rem] font-bold">Talikota Hari Krishna</p>
        </div>
      </div>

      <div className="px-4">
        <NavLink
          to="/posters/new"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          <FaPlus aria-hidden="true" /> Create a poster
        </NavLink>
      </div>

      <ul className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map((item) =>
          item.group ? (
            <li key={item.group} className="px-3 pb-1.5 pt-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/35">
              {item.group}
            </li>
          ) : (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={isActive ? 'text-brand-400' : 'text-white/40'} aria-hidden="true" />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ),
        )}
      </ul>

      <div className="border-t border-white/10 p-3">
        <a
          href={SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 hover:bg-white/5 hover:text-white"
        >
          <FaArrowUpRightFromSquare className="text-white/40" aria-hidden="true" /> View the website
        </a>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/65 hover:bg-white/5 hover:text-white"
        >
          <FaRightFromBracket className="text-white/40" aria-hidden="true" /> Sign out
        </button>
      </div>
    </nav>
  )
}

const Shell = ({ onSignedOut }) => {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const { pathname } = useLocation()

  const reload = useCallback(async () => {
    try {
      setContent(await api('content'))
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const signOut = async () => {
    try {
      await api('logout', {})
    } finally {
      onSignedOut()
    }
  }

  return (
    <ContentContext.Provider value={{ content, reload, loadError }}>
      <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[17rem_1fr]">
        <aside className="sticky top-0 hidden h-screen lg:block">
          <Sidebar onSignOut={signOut} />
        </aside>

        {/* Phone: a top bar and a slide-over menu. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <img src="/tdp-emblem.png" alt="" className="h-8 w-8 rounded-md" />
            <p className="text-sm font-bold text-ink-900">Office Console</p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200" aria-label="Open menu">
            <FaBars aria-hidden="true" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 bg-ink-950/60" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-5 z-10 grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10"
                aria-label="Close menu"
              >
                <FaXmark aria-hidden="true" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} onSignOut={signOut} />
            </div>
          </div>
        )}

        <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-6xl">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/posters" element={<Posters />} />
              <Route path="/posters/new" element={<PosterEditor />} />
              <Route path="/posters/:slug" element={<PosterEditor />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/events" element={<Events />} />
              <Route path="/announcement" element={<Announcement />} />
              <Route path="/contact" element={<ContactSocial />} />
              <Route path="/text" element={<PageText />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/security" element={<Security onSignedOut={onSignedOut} />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </div>
        </main>
      </div>
    </ContentContext.Provider>
  )
}

export default Shell
