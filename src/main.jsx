import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
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
    </BrowserRouter>
  </React.StrictMode>
)

// The build prerenders every route to static HTML, so in production the root
// already has markup and must be hydrated rather than re-created — hydrating
// reuses the server DOM instead of throwing it away and repainting.
// `npm run dev` serves an empty root, which still takes the createRoot path.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
