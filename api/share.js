import { posterBySlug } from '../src/data/posters.js'

/**
 * The page a shared poster link points at: /s/<slug>/<id>, via a rewrite.
 *
 * PEOPLE are sent to /posters/<slug>/view?p=<id>, which opens on the poster
 * itself — full size, with Download, Share, and a "Generate your own" button
 * that goes to the generator. The form is not shown to somebody who came to
 * look at a poster.
 *
 * LINK-PREVIEW CRAWLERS get a tiny HTML page of meta tags whose image is the
 * card made from that exact poster. Its title is the CAMPAIGN's, not the
 * sender's name and designation: the office did not want every forwarded link
 * announcing who made it in the preview text — the poster says that itself.
 *
 * WHY A SEPARATE PATH
 * The campaign page is prerendered, Vercel serves the filesystem before
 * rewrites, and query strings are not part of a static file's cache key — so
 * /posters/<slug>?anything previews identically to the bare page, whatever the
 * query says. A path with nothing static behind it is the way out, and every
 * link ever shared keeps working.
 *
 * Serving crawlers different markup is what Meta documents for this case; the
 * crawler is shown exactly what the person is sent to. The branch is an
 * allowlist of card renderers — anything else, person or unknown bot, gets the
 * redirect, because the opposite test misfires on crawlers with browser-like
 * user agents and the result is a wrong preview cached for good.
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
  const lang = req.query.l === 'te' ? 'te' : 'en'

  const poster = posterBySlug(slug)
  // Old links also carried ?s=<name token>. It is ignored now: the page shows
  // the poster, and somebody making their own starts from blank fields.
  const editor = `${lang === 'te' ? '/te' : ''}/posters/${slug}/view?p=${encodeURIComponent(id)}`

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
    // A person, or a bot with no preview to render: to the poster itself.
    return res.redirect(307, editor)
  }

  const card = `${origin}/c/${id}.jpg`

  /*
   * og:url is this URL, not the campaign page. Facebook treats og:url as
   * canonical and would otherwise fold every personal share back onto the
   * campaign's own card.
   */
  const self = `${origin}/s/${slug}/${id}${lang === 'te' ? '?l=te' : ''}`

  const title = poster.title
  const description =
    lang === 'te'
      ? `${poster.issue} ప్రచార పోస్టర్. మీ పేరు, ఫోటోతో మీ పోస్టర్ ఒక నిమిషంలో తయారు చేసుకోండి.`
      : `A poster for the ${poster.issue} campaign. Make your own with your name and photo in a minute.`

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
