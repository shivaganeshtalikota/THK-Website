import { Routes, Route } from 'react-router-dom'
import { PREFIX } from './i18n'
import { useT } from './i18n/useT'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollReset from './components/ScrollReset'

// Eager imports, deliberately.
//
// These were React.lazy() + Suspense, which is the right call for a normal SPA.
// But the build now prerenders every route to static HTML (scripts/prerender.js)
// so that non-JS crawlers — the AI answer engines and the WhatsApp/Facebook
// link-preview fetchers — get real content. renderToString() renders the
// Suspense *fallback* for a lazy component rather than the page, so lazy routes
// would prerender to a loading spinner.
//
// The trade is ~30KB of extra JS in the main chunk against every page shipping
// real HTML. For a six-page site whose pages are already server-rendered, that
// is clearly worth it: the content is visible before any JS executes.
import Home from './pages/Home'
import About from './pages/About'
import Political from './pages/Political'
import Community from './pages/Community'
import Media from './pages/Media'
import Press from './pages/Press'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import Posters from './pages/Posters'
import PosterStudio from './pages/PosterStudio'
import SharedPoster from './pages/SharedPoster'
import AskPanel from './components/AskPanel'
import AnnouncementBar from './components/AnnouncementBar'

/**
 * The public pages, in one list.
 *
 * Used to mount both language trees below, and kept deliberately separate from
 * `nav` in src/data/site.js — /privacy and /terms are real pages that belong in
 * both languages and in the sitemap, but they are not navigation.
 */
const PAGES = [
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/political', element: <Political /> },
  { path: '/community', element: <Community /> },
  { path: '/media', element: <Media /> },
  { path: '/press', element: <Press /> },
  { path: '/contact', element: <Contact /> },
  { path: '/posters', element: <Posters /> },
  // One editor, addressed by slug, so a new campaign poster is a data entry
  // in src/data/posters.js and not a new route.
  { path: '/posters/:slug', element: <PosterStudio /> },
  // Where a shared poster link opens: the poster itself, with Download and
  // "Make your own". Prerendered, noindex, and out of the sitemap.
  { path: '/posters/:slug/view', element: <SharedPoster /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/terms', element: <Terms /> },
]

function App() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">{t('Skip to main content')}</a>

      <ScrollReset />
      <Navbar />

      {/* pt matches the fixed header so content never hides beneath it. */}
      <main id="main" className="flex-grow pt-[var(--nav-h)]" tabIndex={-1}>
        <AnnouncementBar />
        <Routes>
          {/*
            Every page is mounted twice: once at its English path and once
            under /te. The component is identical — language is read from the
            URL by useT(), so a page does not know or care which prefix it is
            serving, and there is no second copy of any page to keep in step.

            Generated from one list rather than written out twice, so a new
            route cannot be added in English and forgotten in Telugu.
          */}
          {PAGES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          {PAGES.map(({ path, element }) => (
            <Route
              key={`te-${path}`}
              path={path === '/' ? PREFIX : `${PREFIX}${path}`}
              element={element}
            />
          ))}
          {/* The admin panel is a separate app on admin.talikotaharikrishna.com
              (admin.html, src/admin/). It has no route in the public site. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      {/* Site-wide rather than homepage-only: a visitor can land on any page
          from a search result or a shared link, and the questions are as useful
          there. Hidden on /admin, which is not for visitors. */}
      <AskPanel />
      <ScrollToTop />
    </div>
  )
}

export default App
