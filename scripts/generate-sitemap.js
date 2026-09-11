/**
 * Writes sitemap.xml — twice, deliberately.
 *
 *   npm run build (prebuild)  -> public/sitemap.xml   URLs only
 *   after prerender           -> dist/sitemap.xml     URLs + every image
 *
 * WHY TWICE
 * The image entries are read out of the prerendered HTML, which does not exist
 * until after scripts/prerender.js has run. Generating the plain URL sitemap
 * first means a valid sitemap ships even if the second pass is ever skipped or
 * fails; the second pass then overwrites it in dist with the richer version.
 * Vite copies public/ into dist/ before prerendering, so the order holds.
 *
 * WHY IMAGES AT ALL
 * Google's own guidance is that an image sitemap is for "images your site
 * reaches with JavaScript code" — which is precisely this site. The gallery is
 * a React component, the photographs are lazy-loaded, and Search Console was
 * reporting eight indexed pages and not one indexed image. Only <image:loc> is
 * emitted: Google deprecated and now ignores <image:caption>, <image:title>,
 * <image:license> and <image:geo_location>, so writing them would be noise.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const FROM_DIST = process.argv.includes('--from-dist')

/**
 * Origin, resolved in order:
 *   1. $SITE_ORIGIN            — deploy previews / staging
 *   2. site.url in src/data/site.js  — the single source of truth
 *
 * It used to be hardcoded here while src/data/site.js separately declared
 * site.url, so canonicals and the sitemap could silently disagree.
 * site.js can't be imported directly (it pulls in JSX-adjacent app code), so
 * the value is read out of the source text.
 */
function resolveOrigin() {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, '')

  const src = readFileSync(join(ROOT, 'src', 'data', 'site.js'), 'utf8')
  const match = src.match(/^\s*url:\s*['"`]([^'"`]+)['"`]/m)
  if (!match) {
    throw new Error(
      'Could not read `url` from src/data/site.js — the sitemap origin is derived from it. ' +
        'Set SITE_ORIGIN to override.'
    )
  }
  return match[1].replace(/\/$/, '')
}

const ORIGIN = resolveOrigin()

// changefreq/priority are hints. The newsroom changes most; legal pages least.
const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly', file: 'index.html' },
  { path: '/about', priority: '0.9', changefreq: 'monthly', file: 'about/index.html' },
  { path: '/political', priority: '0.9', changefreq: 'weekly', file: 'political/index.html' },
  { path: '/community', priority: '0.8', changefreq: 'monthly', file: 'community/index.html' },
  { path: '/media', priority: '0.8', changefreq: 'weekly', file: 'media/index.html' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly', file: 'contact/index.html' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly', file: 'privacy/index.html' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly', file: 'terms/index.html' },
]

/**
 * Every image a route actually renders, read from its prerendered HTML.
 *
 * Deriving this from the markup rather than from a hand-kept route→photo map
 * is the whole point: the map would drift the first time somebody moved a
 * photograph between pages, and it would never know about the photographs the
 * office publishes from the admin panel. The markup cannot drift — it is what
 * the crawler itself will see.
 *
 * Only the <img> src is taken, not the <source srcset> ladder. One canonical
 * URL per photograph is what Google wants; listing six widths of the same
 * picture would be six chances to pick the wrong one.
 */
function imagesFor(file) {
  const full = join(ROOT, 'dist', file)
  if (!existsSync(full)) return []
  const html = readFileSync(full, 'utf8')

  const found = []
  for (const tag of html.match(/<img[^>]*>/g) ?? []) {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1]
    if (!src) continue
    // Site-relative files only: data: URIs are not fetchable as images and an
    // absolute URL would belong in somebody else's sitemap, not ours.
    if (!src.startsWith('/')) continue
    if (!found.includes(src)) found.push(src)
  }
  return found
}

/**
 * Each route twice — English and Telugu — carrying its hreflang pair.
 *
 * Google accepts hreflang either in the HTML head or in the sitemap. Both are
 * emitted: the tags cover a crawler that arrives at a page directly, and the
 * sitemap covers the case where it reads the manifest first. They have to
 * agree, which they do because both are generated from this same list.
 *
 * Every entry names every alternate INCLUDING itself. A set that omits the
 * self-reference is discarded by Google in full, which is the usual way an
 * hreflang implementation silently does nothing.
 */
const localised = routes.flatMap((r) => {
  const enPath = r.path
  const tePath = r.path === '/' ? '/te' : `/te${r.path}`
  const alternates = [
    { hreflang: 'en-IN', href: ORIGIN + enPath },
    { hreflang: 'te-IN', href: ORIGIN + tePath },
    { hreflang: 'x-default', href: ORIGIN + enPath },
  ]
  return [
    { ...r, path: enPath, file: r.file, alternates },
    {
      ...r,
      path: tePath,
      file: r.file === 'index.html' ? 'te/index.html' : `te/${r.file}`,
      alternates,
      // A translation is not a fresh publication; the Telugu pages do not
      // deserve to outrank their English twins on freshness alone.
      priority: String(Math.max(0.1, Number(r.priority) - 0.1)),
    },
  ]
})

const lastmod = new Date().toISOString().split('T')[0]

// & < > " ' are the five XML predefined entities. A stray & in a filename
// would otherwise make the whole document unparseable, which is exactly how a
// sitemap ends up reported as unreadable.
const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

let imageCount = 0

const body = localised
  .map((r) => {
    const images = FROM_DIST ? imagesFor(r.file) : []
    imageCount += images.length
    const imageXml = images
      .map(
        (src) => `
    <image:image>
      <image:loc>${xmlEscape(ORIGIN + src)}</image:loc>
    </image:image>`
      )
      .join('')
    const altXml = (r.alternates ?? [])
      .map(
        (a) =>
          `
    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}" />`
      )
      .join('')
    return `  <url>
    <loc>${ORIGIN}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>${altXml}${imageXml}
  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`

const out = FROM_DIST ? join(ROOT, 'dist', 'sitemap.xml') : join(ROOT, 'public', 'sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(
  `  sitemap.xml -> ${FROM_DIST ? 'dist' : 'public'} — ${localised.length} URLs` +
    (FROM_DIST ? `, ${imageCount} images` : '') +
    `, ${ORIGIN}, lastmod ${lastmod}`
)
