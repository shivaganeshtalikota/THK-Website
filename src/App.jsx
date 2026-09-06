import { Routes, Route } from 'react-router-dom'
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
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to main content</a>

      <ScrollReset />
      <Navbar />

      {/* pt matches the fixed header so content never hides beneath it. */}
      <main id="main" className="flex-grow pt-[var(--nav-h)]" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/political" element={<Political />} />
          <Route path="/community" element={<Community />} />
          <Route path="/media" element={<Media />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Catch-all: the footer linked to /privacy and /terms with no routes
              behind them, so those clicks rendered a blank page. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default App
