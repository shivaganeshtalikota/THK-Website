import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import { PREFIX } from './i18n'
import { setTelugu } from './i18n/te-store'
import './styles/index.css'

// AOS was initialised here and its stylesheet imported, but no element in the
// app ever carried a data-aos attribute — it was shipping a whole animation
// library and CSS file to every visitor for nothing. Scroll reveals are handled
// by <Reveal>, which is CSS-driven and honours prefers-reduced-motion.

// The app mounted, so cancel the fallback in index.html that would otherwise
// strip the `js` class and disable reveal animations.
clearTimeout(window.__thkReveal)

const container = document.getElementById('root')

const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Client-only, deliberately outside App: App is also the SSR entry
          used by scripts/prerender.js, and this component has nothing to do
          at build time — it injects a script tag and posts view/vitals
          beacons in the browser. Keeping it here means the prerender bundle
          never even imports it. */}
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
)

// The build prerenders every route to static HTML, so in production the root
// already has markup and must be hydrated rather than re-created — hydrating
// reuses the server DOM instead of throwing it away and repainting.
// `npm run dev` serves an empty root, which still takes the createRoot path.
const mount = () => {
  if (container.hasChildNodes()) {
    hydrateRoot(container, tree)
  } else {
    createRoot(container).render(tree)
  }
}

/*
 * The Telugu dictionary is fetched only on Telugu routes, and only before
 * mounting.
 *
 * It is 443 strings — about 68 KB — and it used to sit in the main chunk, so
 * every visitor to an English page downloaded all of it and could not use a
 * byte. A dynamic import moves it to a chunk of its own.
 *
 * The await is the load-bearing part. Hydration re-runs the render against the
 * prerendered Telugu markup; if the dictionary had not arrived, React would
 * produce English, mismatch every node on the page and throw away the server
 * HTML. Mounting is deferred until it is in hand.
 *
 * If the fetch fails the page still mounts, in English, over Telugu markup —
 * ugly, but a working page rather than a blank one. That is the right failure.
 */
const path = window.location.pathname
if (path === PREFIX || path.startsWith(`${PREFIX}/`)) {
  import('./i18n/te.js')
    .then((m) => setTelugu(m.te))
    .catch((err) => console.error('Telugu dictionary failed to load:', err))
    .finally(mount)
} else {
  mount()
}
