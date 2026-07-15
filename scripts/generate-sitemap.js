/**
 * Writes public/sitemap.xml.
 *
 * public/robots.txt has always pointed at /sitemap.xml, but the file was never
 * created — so every crawler that followed that line got a 404. Runs
 * automatically on `npm run build` (see package.json prebuild).
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ORIGIN = 'https://harikrishnatalikota.com'

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

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(`sitemap.xml written — ${routes.length} URLs, lastmod ${lastmod}`)
