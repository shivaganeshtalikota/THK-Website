import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AdminApp from './AdminApp'
import '../styles/index.css'

/**
 * The office panel. A separate app from the public site, served only on
 * admin.talikotaharikrishna.com (see middleware.js), and never prerendered:
 * it is a sign-in screen until the server says otherwise.
 */
createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>,
)
