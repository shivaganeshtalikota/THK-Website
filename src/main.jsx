import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './styles/index.css'

// AOS was initialised here and its stylesheet imported, but no element in the
// app ever carried a data-aos attribute — it was shipping a whole animation
// library and CSS file to every visitor for nothing. Scroll reveals are handled
// by <Reveal>, which uses framer-motion and honours prefers-reduced-motion.

const container = document.getElementById('root')

const tree = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
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
