import { next, rewrite } from '@vercel/functions/middleware'

/**
 * Keeps the admin panel and the public site apart, by hostname.
 *
 *   admin.talikotaharikrishna.com   the office panel, and nothing else. Its
 *                                   own pages and API, plus the static files
 *                                   the panel itself displays. Any public page
 *                                   asked for here is a 404 saying so.
 *   every other host                the public site. The admin app and its API
 *                                   do not exist there: /admin, /admin.html and
 *                                   /api/admin all 404.
 *
 * WHY MIDDLEWARE AND NOT vercel.json
 * Vercel serves files from the filesystem BEFORE it applies rewrites, so a
 * rewrite cannot stop admin.<domain>/about from serving the prerendered About
 * page — which is exactly what it was doing. Middleware runs first. It also
 * means the refusal is a real 404 at the address that was asked for, not a
 * redirect somewhere else.
 *
 * WHY THE PANEL LIVES ON ITS OWN HOST
 * Its session cookie is host-only (__Host- prefix), so it is never sent to the
 * public site, and nothing on the public site — however it might one day be
 * compromised — runs in the panel's origin.
 */

export const ADMIN_HOST = 'admin.talikotaharikrishna.com'

/** The panel's own pages. Everything else on the admin host is refused. */
const ADMIN_ROUTES =
  /^\/(?:|signin|posters|posters\/new|posters\/[a-z0-9][a-z0-9-]{0,47}|gallery|updates|events|announcement|contact|text|activity|security)\/?$/

/** Files the panel needs: its bundle, fonts, the cut-out runtime, and the
 *  images it shows (gallery photos, poster artwork, the party mark). */
const ADMIN_STATIC =
  /^\/(?:assets\/|fonts\/|vision\/|photos\/|posters\/[a-z0-9-]+\.jpg$|tdp-(?:logo|emblem)\.png$|favicon[^/]*$|apple-touch-icon\.png$|version\.json$)/

const PRIVATE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
}

export const config = {
  // Everything except Vercel's own internals. It has to see every path on the
  // admin host, and that cannot be expressed as a path pattern.
  matcher: ['/((?!_vercel/).*)'],
}

function notOnThisSite() {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Not available here</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f0f0e;color:#eeeeec;font:16px/1.6 system-ui,sans-serif}
main{max-width:30rem;padding:2rem}h1{font-size:1.4rem;margin:0 0 .75rem}a{color:#ffd400}p{color:#b8b8b2}code{color:#eeeeec}</style></head>
<body><main><p style="letter-spacing:.14em;text-transform:uppercase;font-size:.72rem;color:#ffd400">404 · Not available here</p>
<h1>This page is not part of the admin site.</h1>
<p><code>admin.talikotaharikrishna.com</code> only hosts the office panel. The public website is at
<a href="https://www.talikotaharikrishna.com/">www.talikotaharikrishna.com</a>.</p>
<p><a href="/">Go to the admin panel</a></p></main></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE } },
  )
}

/** The public site's own 404 page, with a real 404 status. */
async function publicNotFound(request) {
  try {
    const r = await fetch(new URL('/404', request.url))
    // Whatever status the platform gives its own 404 page, the body is the
    // page; the status sent on is always 404.
    if (String(r.headers.get('content-type')).includes('text/html')) {
      return new Response(r.body, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
  } catch {
    // fall through to a bare 404
  }
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const host = String(request.headers.get('host') || url.host).toLowerCase()
  const path = url.pathname
  const onAdminHost = host === ADMIN_HOST || (process.env.ADMIN_DEV === '1' && /^admin\.localhost(:\d+)?$/.test(host))

  if (onAdminHost) {
    if (path === '/api/admin') return next({ headers: PRIVATE })
    if (ADMIN_STATIC.test(path)) return next()
    // '/admin', not '/admin.html': cleanUrls serves admin.html there, and
    // would answer the .html form with a redirect instead.
    if (ADMIN_ROUTES.test(path)) return rewrite(new URL('/admin', request.url), { headers: PRIVATE })
    return notOnThisSite()
  }

  if (path === '/admin' || path === '/admin.html' || path.startsWith('/admin/') || path.startsWith('/api/admin')) {
    return publicNotFound(request)
  }
  return next()
}
