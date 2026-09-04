import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'

/**
 * Server entry used only at build time by scripts/prerender.js.
 *
 * WHY THIS EXISTS
 * This is a client-rendered SPA, and most crawlers that feed AI answer engines
 * — GPTBot, PerplexityBot, ClaudeBot, CCBot — do not execute JavaScript. Nor do
 * the WhatsApp / Facebook / X link-preview fetchers. Without prerendering they
 * all receive `<div id="root"></div>` and nothing else, so:
 *   - sharing a deep link like /political showed the homepage card
 *   - AI engines had no text to answer "who is Hari Krishna Talikota?" from
 *
 * Rendering each route to static HTML at build time fixes both: every page
 * ships real content and its own metadata, and the SPA still hydrates and takes
 * over for real visitors.
 */
export function render(url) {
  const helmetContext = {}

  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>
  )

  return { html, helmet: helmetContext.helmet }
}
