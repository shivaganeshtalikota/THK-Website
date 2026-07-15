import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollReset from './components/ScrollReset'
import Home from './pages/Home'

// Home stays in the main bundle (it's the entry point for most visits);
// the rest split out so the first paint doesn't carry all six pages.
const About = lazy(() => import('./pages/About'))
const Political = lazy(() => import('./pages/Political'))
const Community = lazy(() => import('./pages/Community'))
const Media = lazy(() => import('./pages/Media'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))

const RouteFallback = () => (
  <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
    <span className="sr-only">Loading page…</span>
    <span
      className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink-200 border-t-brand-500"
      aria-hidden="true"
    />
  </div>
)

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to main content</a>

      <ScrollReset />
      <Navbar />

      {/* pt matches the fixed header so content never hides beneath it. */}
      <main id="main" className="flex-grow pt-[var(--nav-h)]" tabIndex={-1}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/political" element={<Political />} />
            <Route path="/community" element={<Community />} />
            <Route path="/media" element={<Media />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* Catch-all: the footer linked to /privacy and /terms with no
                routes behind them, so those clicks rendered a blank page. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default App
