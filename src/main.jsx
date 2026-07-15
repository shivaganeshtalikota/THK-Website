import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './styles/index.css'

// AOS was initialised here and its stylesheet imported, but no element in the
// app ever carried a data-aos attribute — it was shipping a whole animation
// library and CSS file to every visitor for nothing. Scroll reveals are handled
// by <Reveal>, which uses framer-motion and honours prefers-reduced-motion.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
