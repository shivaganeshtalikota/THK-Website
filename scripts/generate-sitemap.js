/**
 * Writes public/sitemap.xml.
 *
 * public/robots.txt has always pointed at /sitemap.xml, but the file was never
 * created — so every crawler that followed that line got a 404. Runs
 * automatically on `npm run build` (see package.json prebuild).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

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

  const src = readFileSync(join(HERE, '..', 'src', 'data', 'site.js'), 'utf8')
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
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.9', changefreq: 'monthly' },
  { path: '/political', priority: '0.9', changefreq: 'weekly' },
  { path: '/community', priority: '0.8', changefreq: 'monthly' },
  { path: '/media', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
]

const lastmod = new Date().toISOString().split('T')[0]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${ORIGIN}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const out = join(HERE, '..', 'public', 'sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(`sitemap.xml written — ${routes.length} URLs at ${ORIGIN}, lastmod ${lastmod}`)
