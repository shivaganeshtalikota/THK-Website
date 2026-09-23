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
 *
 * WITH --api it also runs what Vercel runs in front of and beside the files:
 * the routing middleware (middleware.js), vercel.json's rewrites, and the
 * serverless functions in api/, through a small shim of Vercel's req/res.
 * That is enough to exercise the admin panel end to end on a laptop —
 * sign-in, the authenticator, uploads, publishing — with
 *
 *   ADMIN_DEV=1 ADMIN_ID=... ADMIN_PASSWORD=... \
 *   R2_LOCAL_DIR=<folder> GITHUB_LOCAL_DIR=<folder> \
 *   node scripts/preview-prod.js --api
 *
 * and the panel at http://admin.localhost:4180. R2_LOCAL_DIR and
 * GITHUB_LOCAL_DIR make storage and "commits" plain folders (see server/r2.js
 * and server/github.js), so nothing real is touched. ADMIN_DEV=1 is what lets
 * admin.localhost stand in for the admin host; it is never set on Vercel.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, extname, normalize } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 4180

const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
const rules = vercel.headers
const WITH_API = process.argv.includes('--api')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  // Without application/wasm the browser refuses to stream-compile and falls
  // back to ArrayBuffer instantiation, which downloads the binary a SECOND
  // time. Vercel gets this right; the preview server has to as well, or local
  // testing is not representative of production.
  '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream',
  '.onnx': 'application/octet-stream',
  '.mjs': 'text/javascript; charset=utf-8',
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

/* ---------------------------------------------------------- API emulation */

/** A vercel.json `source` with named params -> a matcher returning params. */
function routeMatcher(source) {
  const names = []
  let out = ''
  for (let i = 0; i < source.length; i++) {
    const rest = source.slice(i)
    const param = /^:([A-Za-z0-9_]+)(\(([^)]+)\))?/.exec(rest)
    if (param) {
      names.push(param[1])
      out += param[3] ? `(${param[3]})` : '([^/]+)'
      i += param[0].length - 1
      continue
    }
    out += source[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  const re = new RegExp(`^${out}$`)
  return (path) => {
    const m = re.exec(path)
    if (!m) return null
    return Object.fromEntries(names.map((n, k) => [n, m[k + 1]]))
  }
}
const REWRITES = (vercel.rewrites || []).map((r) => ({ match: routeMatcher(r.source), dest: r.destination }))

function applyRewrite(pathname, search) {
  for (const r of REWRITES) {
    const params = r.match(pathname)
    if (!params) continue
    let dest = r.dest
    for (const [k, v] of Object.entries(params)) dest = dest.replaceAll(`:${k}`, v)
    const u = new URL(dest, 'http://x')
    new URLSearchParams(search).forEach((v, k) => {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v)
    })
    return u
  }
  return null
}

/** Enough of Vercel's Node helpers for the functions in api/. */
async function runFunction(name, req, res, url) {
  const file = join(ROOT, 'api', `${name}.js`)
  if (!/^[a-z0-9-]+$/.test(name) || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"Not found"}')
    return
  }
  const mod = await import(pathToFileURL(file).href)
  req.query = Object.fromEntries(url.searchParams)
  if (mod.config?.api?.bodyParser !== false && req.method === 'POST') {
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    try {
      req.body = raw ? JSON.parse(raw) : {}
    } catch {
      req.body = raw
    }
  }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(obj))
    return res
  }
  res.send = (body) => {
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
    return res
  }
  res.redirect = (code, loc) => {
    res.statusCode = code
    res.setHeader('Location', loc)
    res.end()
    return res
  }
  try {
    await mod.default(req, res)
  } catch (err) {
    console.error(`api/${name} threw:`, err)
    if (!res.headersSent) res.writeHead(500).end('function error')
  }
}

/** Run middleware.js the way the edge would, and say what it decided. */
async function runMiddleware(req, url) {
  const { default: middleware } = await import(pathToFileURL(join(ROOT, 'middleware.js')).href)
  const request = new Request(url.href, { method: req.method, headers: { host: req.headers.host || '' } })
  const r = await middleware(request)
  const extra = {}
  r.headers.forEach((v, k) => {
    if (!k.startsWith('x-middleware-')) extra[k] = v
  })
  if (r.headers.get('x-middleware-next')) return { kind: 'next', headers: extra }
  const to = r.headers.get('x-middleware-rewrite')
  if (to) return { kind: 'rewrite', url: new URL(to), headers: extra }
  return { kind: 'respond', response: r }
}

/* ------------------------------------------------------------------ server */

function serveFile(pathname, res, extraHeaders = {}) {
  // Contain the path inside dist/ — a served path is attacker-controlled even
  // on a local tool, and `..` would otherwise walk out of the directory.
  const rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '')
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden')
    return true
  }
  // cleanUrls: /about -> dist/about/index.html, mirroring Vercel.
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const candidates = [join(file, 'index.html'), `${file}.html`]
    const found = candidates.find((c) => existsSync(c) && statSync(c).isFile())
    if (!found) return false
    file = found
  }
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, ...headersFor(pathname), ...extraHeaders })
  res.end(readFileSync(file))
  return true
}

function notFound(pathname, res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...headersFor(pathname) })
  res.end(readFileSync(join(DIST, '404.html')))
}

createServer(async (req, res) => {
  let url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`)
  let extra = {}

  if (WITH_API) {
    const mw = await runMiddleware(req, url)
    if (mw.kind === 'respond') {
      const headers = {}
      mw.response.headers.forEach((v, k) => (headers[k] = v))
      res.writeHead(mw.response.status, headers)
      res.end(Buffer.from(await mw.response.arrayBuffer()))
      return
    }
    extra = mw.headers
    if (mw.kind === 'rewrite') url = new URL(mw.url.pathname + mw.url.search, url)

    if (url.pathname.startsWith('/api/')) {
      for (const [k, v] of Object.entries(extra)) res.setHeader(k, v)
      await runFunction(url.pathname.slice(5), req, res, url)
      return
    }
  }

  // Filesystem first, then rewrites — Vercel's order.
  if (serveFile(url.pathname, res, extra)) return
  if (WITH_API) {
    const to = applyRewrite(url.pathname, url.search)
    if (to && to.pathname.startsWith('/api/')) {
      await runFunction(to.pathname.slice(5), req, res, to)
      return
    }
  }
  notFound(url.pathname, res)
}).listen(PORT, () => {
  console.log(`dist/ with production headers -> http://localhost:${PORT}${WITH_API ? '  (+ middleware, rewrites, api/)' : ''}`)
})
