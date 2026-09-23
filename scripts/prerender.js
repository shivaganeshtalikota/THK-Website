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
import { parseManifest } from '../server/campaign-manifest.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const DIST = join(ROOT, 'dist')

// Keep in sync with the <Routes> in src/App.jsx and scripts/generate-sitemap.js.
/*
 * The poster slugs are read from the data rather than repeated here, so adding
 * a campaign does not mean remembering to prerender it.
 *
 * Two sources, because there are two kinds. The hand-written entries live in
 * posters.js, which is plain data with no app imports and can be parsed out of
 * the source text. The ones published from the admin panel live in a JSON
 * manifest that the publishing endpoint appends to.
 *
 * Both have to be read here or a poster his office publishes would exist in the
 * app and have no prerendered page — which fails in the least visible way
 * possible: the route works when clicked from inside the site, and 404s for
 * every crawler, every WhatsApp preview and anybody who opens the link cold.
 */
const posterSlugs = (() => {
  const src = readFileSync(join(ROOT, 'src', 'data', 'posters.js'), 'utf8')
  const builtIn = [...src.matchAll(/^\s*slug:\s*'([^']+)'/gm)].map((m) => m[1])

  let published = []
  try {
    const manifest = parseManifest(
      readFileSync(join(ROOT, 'src', 'data', 'campaign-posters.js'), 'utf8'),
    )
    published = (manifest.posters ?? []).map((p) => p.slug).filter(Boolean)
  } catch {
    // No manifest yet, or an unreadable one. The built-in posters still build.
  }

  return [...new Set([...published, ...builtIn])]
})()

const EN_ROUTES = [
  '/',
  '/about',
  '/political',
  '/community',
  '/media',
  '/contact',
  '/posters',
  ...posterSlugs.map((slug) => `/posters/${slug}`),
  '/privacy',
  '/terms',
]

/**
 * The same eight pages again under /te.
 *
 * Prerendering both trees is what makes the Telugu real to a search engine:
 * /te/about becomes a static HTML file with Telugu in the body, its own title
 * and description, and an hreflang pair pointing at its English twin. Without
 * it the Telugu would exist only after JavaScript ran — exactly the situation
 * the rest of this script was written to fix.
 */
const TE_ROUTES = EN_ROUTES.map((r) => (r === '/' ? '/te' : `/te${r}`))

const ROUTES = [...EN_ROUTES, ...TE_ROUTES]

// Routes rendered but kept out of the sitemap: the viewer a shared poster link
// opens on (one per campaign and language — which poster it shows comes from
// ?p= in the browser). They are noindex; they exist only to be linked to.
//
// The admin panel is NOT here. It moved to its own app on
// admin.talikotaharikrishna.com (admin.html) and must not exist as a page on
// the public site at all.
const UNLISTED_ROUTES = posterSlugs.flatMap((slug) => [`/posters/${slug}/view`, `/te/posters/${slug}/view`])

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
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="profile:[^"]*"[^>]*>\s*/gi, '')
}

function compose(template, head, bodyHtml, route = '/') {
  /*
   * <html lang> has to match the page, not the template.
   *
   * The template hardcodes en-IN. Left alone, every Telugu page would declare
   * itself English — which mispronounces the page in a screen reader, tells
   * Google the Telugu pages are English (undoing the hreflang pair), and gives
   * the font stack no reason to reach for the Telugu face.
   */
  const isTe = route === '/te' || route.startsWith('/te/')
  return stripTemplateHead(template)
    .replace(/<html lang="[^"]*">/i, `<html lang="${isTe ? 'te-IN' : 'en-IN'}">`)
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
  for (const route of [...ROUTES, ...UNLISTED_ROUTES]) {
    const { html, head } = render(route)
    const page = compose(template, head, html, route)

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
