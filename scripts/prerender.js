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

/** Escape a value for use inside a double-quoted HTML attribute. */
const attr = (v) =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Turn the head collector into HTML.
 *
 * Every element is marked data-head="1" so the client-side manager in
 * src/components/Head.jsx can find and replace exactly these on navigation,
 * without disturbing the hand-written tags in index.html.
 */
function serialiseHead({ title, tags }) {
  const out = []
  if (title) out.push(`<title data-head="1">${attr(title)}</title>`)
  for (const tag of tags ?? []) {
    const { _tag, _text, ...rest } = tag
    const a = Object.entries(rest)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}="${attr(v)}"`)
      .join(' ')
    out.push(
      _text != null
        ? // JSON-LD only; its content is JSON.stringify output, so the one
          // sequence that could break out of a <script> is escaped.
          `<${_tag} data-head="1" ${a}>${String(_text).replace(/<\//g, '<\\/')}</${_tag}>`
        : `<${_tag} data-head="1" ${a}>`
    )
  }
  return out.join('\n    ')
}

/**
 * Strip the template's own title/description/canonical/OG/twitter so the
 * per-route versions from <Seo> are authoritative and nothing is duplicated.
 *
 * The template's JSON-LD is deliberately KEPT. It carries the site-wide @graph
 * (Person -> PoliticalParty -> WebSite) that identifies him as an entity, which
 * is what Google builds a Knowledge Panel from and what AI answer engines read.
 * Stripping it left each page with only its own page-type schema and no Person
 * at all. Page schemas reference the Person by @id, so the blocks merge rather
 * than conflict.
 */
function stripTemplateHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="profile:[^"]*"[^>]*>\s*/gi, '')
}

function compose(template, head, bodyHtml) {
  return stripTemplateHead(template)
    .replace('</head>', `  ${serialiseHead(head)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
}

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
    const { html, head } = render(route)
    const page = compose(template, head, html)

    const outDir = route === '/' ? DIST : join(DIST, route)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), page, 'utf8')

    console.log(`  ${route.padEnd(12)} -> ${Math.round(Buffer.byteLength(page) / 1024)}KB`)
    count++
  }

  // 404.html — static hosts (Vercel, Netlify, GitHub Pages) serve this for any
  // path matching no file, with a real 404 status. Deliberately NOT a catch-all
  // rewrite to index.html: that returns HTTP 200 for every wrong URL, telling
  // crawlers those pages exist and manufacturing soft-404s across the site.
  const nf = render('/__not_found__')
  const notFound = compose(template, nf.head, nf.html)
  writeFileSync(join(DIST, '404.html'), notFound, 'utf8')
  console.log(`  404.html     -> ${Math.round(Buffer.byteLength(notFound) / 1024)}KB`)

  console.log(`\nprerendered ${count} routes + 404`)
}

main().catch((err) => {
  console.error('\nPrerender failed:', err.message)
  process.exit(1)
})
