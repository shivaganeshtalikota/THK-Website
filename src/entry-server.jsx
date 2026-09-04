import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HeadCollector } from './components/Head'
import App from './App'

/**
 * Server entry, used only at build time by scripts/prerender.js.
 *
 * WHY PRERENDER AT ALL
 * This is a client-rendered SPA, and most crawlers that feed AI answer engines
 * — GPTBot, PerplexityBot, ClaudeBot, CCBot — do not execute JavaScript. Nor do
 * the WhatsApp / Facebook / X link-preview fetchers. Without prerendering they
 * all receive `<div id="root"></div>` and nothing else, so sharing a deep link
 * showed the homepage card and AI engines had no text about him to read.
 *
 * `collector` is filled in by useHead during render; prerender.js serialises it
 * into the static <head>.
 */
export function render(url) {
  const collector = { title: null, tags: [] }

  const html = renderToString(
    <StrictMode>
      <HeadCollector collector={collector}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HeadCollector>
    </StrictMode>
  )

  return { html, head: collector }
}
