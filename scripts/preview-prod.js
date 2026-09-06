/**
 * Serves dist/ with the exact headers vercel.json will apply in production.
 *
 * WHY THIS EXISTS
 * `vite preview` serves the built site with no security headers at all, so the
 * production CSP is never exercised until the site is live. That gap shipped a
 * real outage: the Google Fonts <link> used an inline onload handler, which
 * `script-src 'self'` blocks, and every webfont on the site fell back to
 * Georgia and system-ui — visible only in production, perfect on localhost.
 *
 * This reads the policy out of vercel.json rather than restating it, so the
 * two cannot drift.
 *
 *   node scripts/preview-prod.js      -> http://localhost:4180
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, normalize } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 4180

const rules = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/vnd.microsoft.icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

/** Apply every vercel.json rule whose `source` glob matches this path. */
function headersFor(pathname) {
  const out = {}
  for (const rule of rules) {
    const re = new RegExp(
      '^' + rule.source.replace(/\//g, '\\/').replace(/\(\.\*\)/g, '.*').replace(/\.(?=\()/g, '\\.') + '$'
    )
    if (re.test(pathname)) for (const h of rule.headers) out[h.key] = h.value
  }
  return out
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  // Contain the path inside dist/ — a served path is attacker-controlled even
  // on a local tool, and `..` would otherwise walk out of the directory.
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  // cleanUrls: /about -> dist/about/index.html, mirroring Vercel.
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const candidates = [join(file, 'index.html'), `${file}.html`]
    file = candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? join(DIST, '404.html')
  }

  const status = file.endsWith('404.html') && url.pathname !== '/404.html' ? 404 : 200
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  res.writeHead(status, { 'Content-Type': type, ...headersFor(url.pathname) })
  res.end(readFileSync(file))
}).listen(PORT, () => {
  console.log(`dist/ with production headers -> http://localhost:${PORT}`)
})
