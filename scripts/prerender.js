/**
 * Renders every route to static HTML after the client build.
 *
 * WHY
 * A client-rendered SPA serves `<div id="root"></div>` and nothing else to any
 * client that does not run JavaScript. That includes:
 *   - the WhatsApp / Facebook / X / Telegram link-preview fetchers, so sharing
 *     a deep link showed whatever was hardcoded in index.html (the homepage)
 *   - GPTBot, PerplexityBot, ClaudeBot, CCBot and friends, so AI answer engines
 *     had no text about him to read at all
 *
 * After this step, dist/ contains a real HTML document per route: correct
 * <title>, description, canonical, Open Graph tags, JSON-LD, and the full page
 * body. The SPA hydrates on top for real visitors.
 *
 * Runs automatically as part of `npm run build`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const DIST = join(ROOT, 'dist')

// Keep in sync with the <Routes> in src/App.jsx and scripts/generate-sitemap.js.
const ROUTES = ['/', '/about', '/political', '/community', '/media', '/contact', '/privacy', '/terms']

async function main() {
  const serverEntry = join(ROOT, 'dist-ssr', 'entry-server.js')
  if (!existsSync(serverEntry)) {
    throw new Error(
      `SSR bundle missing at ${serverEntry}. ` +
        'Run `vite build --ssr src/entry-server.jsx --outDir dist-ssr` first.'
    )
  }

  const { render } = await import(pathToFileURL(serverEntry).href)
  const template = readFileSync(join(DIST, 'index.html'), 'utf8')

  let count = 0
  for (const route of ROUTES) {
    const { html, helmet } = render(route)

    // Replace the static head tags with this route's own. react-helmet-async
    // gives back ready-to-inject strings; `.toString()` includes the tag markup.
    let page = template

    // `priority` first: <Seo> sets prioritizeSeoTags, which moves description,
    // canonical, the Open Graph block and the JSON-LD into this bucket rather
    // than meta/link/script. Omitting it silently dropped every canonical and
    // every structured-data block from the prerendered pages.
    const head = [
      helmet?.title?.toString(),
      helmet?.priority?.toString(),
      helmet?.meta?.toString(),
      helmet?.link?.toString(),
      helmet?.script?.toString(),
    ]
      .filter((s) => s && s.trim())
      .join('\n    ')

    // Drop the template's title/description/canonical/OG/twitter so the
    // per-route versions from <Seo> are authoritative and nothing is duplicated.
    //
    // The template's JSON-LD is deliberately KEPT. It carries the site-wide
    // @graph (Person -> PoliticalParty -> WebSite) that identifies him as an
    // entity, which is what Google builds a Knowledge Panel from and what AI
    // answer engines read. Stripping it left each page with only its own
    // page-type schema and no Person at all. Page schemas reference the Person
    // by @id, so the two blocks merge rather than conflict.
    page = page
      .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
      .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
      .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
      .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
      .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
      .replace(/<meta\s+property="profile:[^"]*"[^>]*>\s*/gi, '')

    page = page.replace('</head>', `  ${head}\n  </head>`)
    page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`)

    const outDir = route === '/' ? DIST : join(DIST, route)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), page, 'utf8')

    const kb = Math.round(Buffer.byteLength(page) / 1024)
    console.log(`  ${route.padEnd(12)} -> ${kb}KB`)
    count++
  }

  console.log(`\nprerendered ${count} routes`)
}

main().catch((err) => {
  console.error('\nPrerender failed:', err.message)
  process.exit(1)
})
