import { createHash, randomBytes } from 'node:crypto'
import { r2Config, r2Put, r2List } from '../server/r2.js'
import { imageSize, isJpeg } from '../server/image.js'
import { posterBySlug } from '../src/data/posters.js'

/**
 * Stores the preview card for a poster somebody has personalised, so that chat
 * apps can show it when they forward the link.
 *
 * WHY THIS EXISTS AT ALL, GIVEN THE REST OF THIS FEATURE UPLOADS NOTHING
 * Link-preview crawlers do not run JavaScript and will not accept a data: URL.
 * For WhatsApp to show somebody's own poster, that image has to be sitting at a
 * URL when the crawler asks. There is no client-side way round it. Everything
 * else stays on the device: the photograph, the segmentation, the compositing.
 * What lands here is the finished 1200x630 card and nothing else — never the
 * original photograph, never the full-resolution poster.
 *
 * AND IT IS OPT-IN. Nothing reaches this endpoint unless the visitor presses
 * "Show my poster in the link preview". Someone who does not press it uploads
 * nothing at all, which is why the page can still promise what it promises.
 *
 * WHAT THIS ENDPOINT IS, HONESTLY
 * It accepts an image from anyone and serves it back from this domain. The
 * checks below bound that — a JPEG, exactly card-shaped, small, rate-limited
 * per address, at an unguessable key, deleted after thirty days by an R2
 * lifecycle rule. They do not make it impossible to abuse: nothing here proves
 * the bytes came from this tool rather than from a script that produced a
 * 1200x630 JPEG. Binding uploads to the artwork would mean decoding pixels
 * server-side and comparing them against a fingerprint of the fixed left-hand
 * region of the card; that is the next control worth adding if this is ever
 * abused, and POSTER_CARDS_ENABLED=0 turns the whole thing off in the meantime
 * without a deploy.
 *
 * Environment (Vercel > Settings > Environment Variables — never in the repo,
 * which is public):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   POSTER_CARDS_ENABLED   optional; set to "0" to refuse new uploads
 */

/** The card is 1200x630 and about 150KB. The ceiling is generous enough for a
 *  busy photograph and far below Vercel's ~4.5MB body cap. */
const MAX_BYTES = 400 * 1024

/** Base64 inflates by a third, and the JSON wrapper adds a little more. */
const MAX_BODY_CHARS = Math.ceil((MAX_BYTES * 4) / 3) + 2048

const CARD_W = 1200
const CARD_H = 630

/** Uploads allowed from one address per hour. A supporter makes one poster,
 *  occasionally a handful; a script makes thousands. */
const RATE_LIMIT = 12

/**
 * The caller's address, hashed.
 *
 * Hashed rather than stored, because the point is to count repeats, not to
 * keep a record of who made a poster — this is a political site and a list of
 * addresses that generated campaign material is not a thing worth having. The
 * hash is salted with the account id so the keys are meaningless elsewhere, and
 * the counters expire with everything else under the lifecycle rule.
 */
function addressKey(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = fwd || req.socket?.remoteAddress || 'unknown'
  return createHash('sha256')
    .update(`${process.env.R2_ACCOUNT_ID || ''}:${ip}`)
    .digest('hex')
    .slice(0, 24)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (process.env.POSTER_CARDS_ENABLED === '0') {
    return res.status(503).json({ error: 'Link previews are turned off at the moment.' })
  }
  if (!r2Config()) {
    return res.status(501).json({ error: 'Card storage is not configured.' })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body ?? {}
  // Checked against the real campaigns, not merely against a shape. Accepting
  // any slug-shaped string would make this a general image host for posters
  // that do not exist, which is a strictly larger surface for no benefit.
  const slug = String(body.slug || '').slice(0, 64)
  if (!/^[a-z0-9-]+$/.test(slug) || !posterBySlug(slug)) {
    return res.status(400).json({ error: 'Unknown poster.' })
  }

  const raw = String(body.image || '')
  if (!raw || raw.length > MAX_BODY_CHARS) {
    return res.status(413).json({ error: 'That image is too large.' })
  }

  let buf
  try {
    buf = Buffer.from(raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw, 'base64')
  } catch {
    return res.status(400).json({ error: 'That image could not be read.' })
  }

  // The real first bytes, not the declared type and not the filename.
  if (!isJpeg(buf)) return res.status(415).json({ error: 'The card must be a JPEG.' })
  if (buf.length > MAX_BYTES) return res.status(413).json({ error: 'That image is too large.' })

  const size = imageSize(buf)
  if (!size || size.w !== CARD_W || size.h !== CARD_H) {
    return res.status(400).json({
      error: `The card must be exactly ${CARD_W}x${CARD_H}.`,
    })
  }

  // Rate limit. Counted by listing this hour's markers for the address, which
  // is racy under a burst and deliberately so: it bounds sustained abuse
  // without a database, and a few extra cards slipping through a race is a far
  // smaller problem than another runtime dependency.
  const who = addressKey(req)
  const hour = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH
  const rlPrefix = `rl/${hour}/${who}/`
  try {
    const seen = await r2List(rlPrefix, RATE_LIMIT + 1)
    if (seen.length >= RATE_LIMIT) {
      res.setHeader('Retry-After', '3600')
      return res.status(429).json({ error: 'Too many posters from this connection. Try again later.' })
    }
  } catch {
    // A failure to count must not become a failure to make a poster.
  }

  const id = randomBytes(16).toString('base64url') // 128 bits, unguessable
  try {
    await r2Put(`cards/${id}.jpg`, buf, 'image/jpeg')
    // Written after the card, so a failed upload does not spend the allowance.
    r2Put(`${rlPrefix}${Date.now().toString(36)}`, Buffer.from('1'), 'text/plain').catch(() => {})
  } catch (err) {
    console.error('poster-card upload failed:', err)
    return res.status(502).json({ error: 'The preview could not be saved. Your poster is unaffected.' })
  }

  return res.status(200).json({ id })
}

function safeParse(s) {
  try {
    return JSON.parse(s || '{}')
  } catch {
    return {}
  }
}
