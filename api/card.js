import { r2Config, r2Get } from '../server/r2.js'

/**
 * Serves a stored poster, or its link-preview card.
 *
 *   /c/<id>.jpg     the 1200x630 card crawlers show in a link preview
 *   /c/<id>-p.jpg   the full-resolution poster the link opens on
 *
 * Read through this site rather than from a public bucket: R2's r2.dev domain
 * is rate-limited and not for production, a custom R2 domain would mean moving
 * this domain's DNS, and serving same-origin keeps the images inside the
 * existing img-src 'self' policy. R2 charges no egress and the CDN caches the
 * response, so repeats never reach this function.
 *
 * Objects are immutable — the id is random and the bytes behind it never
 * change — so they cache hard. The lifecycle rule deletes them after thirty
 * days; a request after that gets an honest 404.
 */

const ID = /^[A-Za-z0-9_-]{22}$/ // 16 random bytes, base64url, no padding

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }

  const id = String(req.query.id || '').replace(/\.jpg$/, '')
  if (!ID.test(id)) return res.status(404).end()
  const variant = req.query.v === 'p' ? '-p' : ''

  if (!r2Config()) return res.status(501).end()

  let buf
  try {
    buf = await r2Get(`cards/${id}${variant}.jpg`)
  } catch (err) {
    console.error('card read failed:', err)
    return res.status(502).end()
  }
  if (!buf) {
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(404).end()
  }

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Content-Length', String(buf.length))
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, immutable')
  // Supporters' faces should not turn up in image search.
  res.setHeader('X-Robots-Tag', 'noindex, noimageindex')
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method === 'HEAD') return res.status(200).end()
  return res.status(200).send(buf)
}
