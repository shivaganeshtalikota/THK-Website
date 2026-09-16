import { posterBySlug } from '../src/data/posters.js'

/**
 * The page a shared poster link points at. Reached as /s/<slug>/<id> via a
 * rewrite, and it exists for one reason: to hand crawlers a preview card that
 * is specific to the poster the sender actually made.
 *
 * WHY A NEW PATH INSTEAD OF /posters/<slug>?s=<token>
 * Because that cannot work, and it was checked rather than assumed. On Vercel
 * the filesystem is consulted before rewrites, and query strings are not part
 * of the cache key for a static file, so the prerendered page wins whatever the
 * query string says. Fetched from production as facebookexternalhit, the bare
 * poster URL and the same URL with ?s= return byte-identical HTML with the same
 * ETag. Making the existing path dynamic would mean either deleting its
 * prerendered file or putting middleware in front of a page whose inline script
 * is sha256-pinned in the CSP. A path with no static file behind it avoids all
 * of that — and every link already shared keeps working, previewing as the
 * campaign card.
 *
 * CRAWLERS GET HTML, PEOPLE GET THE EDITOR. Serving different markup to link
 * crawlers is what Meta's own documentation describes for this case; it is not
 * cloaking, since the crawler is shown exactly the thing the human is being
 * sent to. The branch is an allowlist of crawler user agents, and anything
 * else — a person, an unknown bot — is redirected. That ordering matters: the
 * inverse test ("does it look like a browser?") misfires on any crawler that
 * sends a browser-like header, and the failure is a cached wrong preview that
 * cannot be undone.
 */

const ID = /^[A-Za-z0-9_-]{22}$/

/** Agents that render link previews. These get the meta tags. */
const CARD_CRAWLERS =
  /facebookexternalhit|facebookcatalog|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|redditbot|Applebot|Pinterest|vkShare|iframely|embedly/i

/**
 * Search engines, which are a different problem from card renderers.
 *
 * These pages are thin and endless — one per shared poster — and have no
 * business in an index. But a blanket noindex cannot be used, because X will
 * not build a card for a page carrying one, and an X card is precisely what
 * this endpoint exists to produce. So the directive goes only to the agents
 * that index, and never to the agents that render.
 */
const SEARCH_CRAWLERS = /Googlebot|bingbot|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot/i

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Decode the name/designation token. Mirrors src/lib/posterLink.js, on the
 *  server side and defensively: every field here is attacker-supplied. */
function readToken(token) {
  if (!token || token.length > 512) return null
  try {
    const b64 = String(token).replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64').toString('utf8')
    const data = JSON.parse(json)
    if (!data || typeof data !== 'object') return null
    return {
      name: String(data.n || '').slice(0, 80),
      designation: String(data.d || '').slice(0, 80),
    }
  } catch {
    return null
  }
}

/**
 * The site's own origin, never the one the request claims.
 *
 * Host and X-Forwarded-Host are attacker-controlled. Building og:image out of
 * them would let a forged header produce a page on this domain whose preview
 * image is fetched from somewhere else entirely — a card served under this
 * politician's name and outside his control. The allowlist exists so preview
 * deployments still work; anything unrecognised falls back to production.
 */
const CANONICAL = 'https://www.talikotaharikrishna.com'
const ALLOWED_HOSTS = /^(www\.talikotaharikrishna\.com|[a-z0-9-]+\.vercel\.app|localhost(:\d+)?)$/i

function safeOrigin(req) {
  const claimed = String(req.headers['x-forwarded-host'] || req.headers.host || '')
  if (!ALLOWED_HOSTS.test(claimed)) return CANONICAL
  const proto = claimed.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${claimed}`
}

export default async function handler(req, res) {
  const origin = safeOrigin(req)
  const slug = String(req.query.slug || '')
  const id = String(req.query.id || '')
  const token = String(req.query.s || '')
  const lang = req.query.l === 'te' ? 'te' : 'en'

  const poster = posterBySlug(slug)
  const editor = `${lang === 'te' ? '/te' : ''}/posters/${slug}${token ? `?s=${encodeURIComponent(token)}` : ''}`

  // An unknown poster or a malformed id is not worth a special page.
  if (!poster || !ID.test(id)) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    return res.redirect(307, lang === 'te' ? '/te/posters' : '/posters')
  }

  const ua = String(req.headers['user-agent'] || '')

  /*
   * Set before the branch, not inside it.
   *
   * There is one of these URLs per shared poster, forever, and none of them
   * belongs in a search index. Googlebot is not a card renderer, so it takes
   * the redirect below — and a 307 can leave the redirecting URL indexed, so
   * the directive has to be on that response too. Setting it after the branch
   * meant it was only ever sent on a path Googlebot never takes, which is the
   * kind of bug that looks correct in the source and does nothing at all.
   */
  if (SEARCH_CRAWLERS.test(ua)) res.setHeader('X-Robots-Tag', 'noindex, follow')

  /*
   * NEVER CACHED AT THE EDGE, and this was a bug in production before it was a
   * comment here.
   *
   * This response depends on the user agent: a crawler gets meta tags, a person
   * gets a redirect. The crawler branch was returning s-maxage, so Vercel's CDN
   * cached that HTML under the URL alone and then served it to everybody —
   * people following a shared link got a near-blank page with two meta tags
   * instead of the editor. A `Vary: User-Agent` would technically fix it and is
   * sent below, but it also defeats edge caching entirely, since no two browsers
   * send the same UA string. So the honest thing is to not cache: the function
   * is cheap, these URLs are low-traffic by nature, and a takedown then takes
   * effect at once rather than whenever an edge node feels like revalidating.
   */
  res.setHeader('Vary', 'User-Agent')
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (!CARD_CRAWLERS.test(ua)) {
    // A person, or a bot with no preview to render. Send them to the real
    // editor with the sender's name already filled in — which is the whole
    // point of the link, and is what the crawler is being told about.
    return res.redirect(307, editor)
  }

  const from = readToken(token)
  const who = from?.name?.trim()
  const card = `${origin}/c/${id}.jpg`

  /*
   * og:url is this URL, token and all — not the poster page.
   *
   * Facebook treats og:url as canonical and will fold the share onto whatever
   * it names. Pointing it at /posters/<slug> would silently collapse every
   * personalised share back onto the campaign card, which is the exact bug this
   * endpoint exists to avoid, and it would look like the feature simply did not
   * work.
   */
  const self = `${origin}/s/${slug}/${id}${token ? `?s=${encodeURIComponent(token)}` : ''}${
    lang === 'te' ? `${token ? '&' : '?'}l=te` : ''
  }`

  const title = who ? `${who} — ${poster.title}` : poster.title
  const description = who
    ? `${who} made a poster for the ${poster.issue} campaign. Make yours in under a minute.`
    : `Put your name and photo on the ${poster.issue} campaign poster and share it.`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  return res.status(200).send(`<!doctype html>
<html lang="${lang === 'te' ? 'te-IN' : 'en-IN'}">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(self)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Talikota Hari Krishna Official">
<meta property="og:locale" content="${lang === 'te' ? 'te_IN' : 'en_IN'}">
<meta property="og:url" content="${esc(self)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(card)}">
<meta property="og:image:secure_url" content="${esc(card)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@THK_iTDP">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(card)}">
<meta name="twitter:image:alt" content="${esc(title)}">
</head>
<body>
<p><a href="${esc(editor)}">Open this poster</a></p>
</body>
</html>`)
}
