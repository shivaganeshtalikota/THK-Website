import { r2Config, r2Get } from '../server/r2.js'

/**
 * Serves a stored preview card. Reached as /c/<id>.jpg via a rewrite.
 *
 * WHY THROUGH THIS SITE RATHER THAN FROM THE BUCKET
 * R2's public r2.dev domain is documented as rate-limited and not for
 * production, and a custom R2 domain would need this domain's DNS moved to
 * Cloudflare — it is on Vercel's nameservers, and that is not a change worth
 * making to serve preview images. Reading through here keeps the bucket
 * private, keeps the image same-origin with the page that references it (so
 * the existing img-src 'self' policy already covers it, with no CSP change),
 * and costs nothing: R2 charges no egress, and the cache header below means
 * the CDN answers repeats without invoking this function again.
 *
 * Cards are immutable — the id is a hash-shaped random string and the bytes
 * behind it never change — so they cache hard. The lifecycle rule deletes the
 * object after thirty days; a request after that gets an honest 404.
 */

const ID = /^[A-Za-z0-9_-]{22}$/ // 16 random bytes, base64url, no padding

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }

  const id = String(req.query.id || '').replace(/\.jpg$/, '')
  if (!ID.test(id)) return res.status(404).end()

  if (!r2Config()) return res.status(501).end()

  let buf
  try {
    buf = await r2Get(`cards/${id}.jpg`)
  } catch (err) {
    console.error('card read failed:', err)
    return res.status(502).end()
  }
  if (!buf) {
    // Expired or never existed. Cached briefly so a burst of crawler retries on
    // a dead link does not keep hitting R2, but not so long that a card
    // uploaded moments later stays invisible.
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(404).end()
  }

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Content-Length', String(buf.length))
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, immutable')
  // Supporters' faces should not turn up in image search. This is a directive
  // on the image itself; the page that embeds it stays crawlable, which is what
  // the card renderers actually need.
  res.setHeader('X-Robots-Tag', 'noindex, noimageindex')
  res.setHeader('Content-Disposition', 'inline')
  // The bytes came from an upload, so forbid any sniffing into something active.
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method === 'HEAD') return res.status(200).end()
  return res.status(200).send(buf)
}
