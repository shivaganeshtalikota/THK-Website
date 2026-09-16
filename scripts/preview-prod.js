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
 * WHY THE CACHING RULES LOOK THE WAY THEY DO (vercel.json cannot hold comments —
 * it is JSON, and Vercel's schema rejects unknown keys outright, failing the
 * deployment before the build even starts):
 *
 *   /assets, /fonts, /photos  -> immutable, one year.
 *       /assets is content-hashed by Vite, so changed content means a changed
 *       URL. /fonts filenames encode family+weight+subset, so a given name's
 *       bytes never change. /photos is slug-named and carries the same hazard
 *       the favicons hit, but these are the largest assets on the site; if a
 *       photograph is ever re-cropped, change its slug rather than its bytes.
 *
 *   favicons, og-image, tdp-*, site.webmanifest -> revalidate daily.
 *       These are UNVERSIONED names whose CONTENT changes in place. A blanket
 *       immutable rule for png/jpg/ico used to catch them, which told every
 *       browser never to revalidate for a year — so a favicon change never
 *       reached anyone who had already loaded the old one. immutable is only
 *       ever correct for content-hashed URLs.
 *
 *   They are written as separate literal sources rather than one alternation:
 *   Vercel parses `source` with path-to-regexp, where nested groups do not mean
 *   what they mean in a raw regex.
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
  // Without application/wasm the browser refuses to stream-compile and falls
  // back to ArrayBuffer instantiation, which downloads the binary a SECOND
  // time. Vercel gets this right; the preview server has to as well, or local
  // testing is not representative of production.
  '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream',
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

/**
 * Apply every vercel.json rule whose `source` matches this path.
 *
 * Vercel parses `source` with path-to-regexp, not as a raw regex, so this
 * translates the subset actually used here: `(.*)` wildcards, `:name` params,
 * `:name*` greedy params and `:name(a|b)` constrained params. Getting this
 * wrong would make the local preview disagree with production about caching —
 * which is precisely the class of bug it exists to catch.
 */
function sourceToRegExp(source) {
  let out = ''
  for (let i = 0; i < source.length; i++) {
    const rest = source.slice(i)
    if (rest.startsWith('(.*)')) { out += '.*'; i += 3; continue }
    const param = /^:([A-Za-z0-9_]+)(\(([^)]+)\))?(\*|\+|\?)?/.exec(rest)
    if (param) {
      const [full, , , pattern, mod] = param
      out += pattern ? `(?:${pattern})` : mod === '*' || mod === '+' ? '.*' : '[^/]+'
      if (!pattern && (mod === '*' || mod === '?')) out += '?'
      i += full.length - 1
      continue
    }
    out += source[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${out}$`)
}

function headersFor(pathname) {
  const out = {}
  for (const rule of rules) {
    if (sourceToRegExp(rule.source).test(pathname)) {
      for (const h of rule.headers) out[h.key] = h.value
    }
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
