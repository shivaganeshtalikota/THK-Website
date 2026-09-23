import { createHash, randomBytes } from 'node:crypto'
import { r2Config, r2Put, r2List } from '../server/r2.js'
import { imageSize, isJpeg } from '../server/image.js'
import { posterBySlug } from '../src/data/posters.js'

/**
 * Stores a poster somebody has made, so the link they share can show it.
 *
 * WHAT ARRIVES
 * Two JPEGs in one request: the finished poster at full resolution — what the
 * person who opens the link sees, and can download — and a 1200x630 card of it
 * for link-preview crawlers, which want that shape and a small file. The
 * photograph the poster was made from never leaves the device; the background
 * is removed and the poster composed in the browser.
 *
 * WHY IT IS NO LONGER OPT-IN
 * It was: a button asked whether to put the poster in the link preview. The
 * office found that nobody understood the question and everybody wanted the
 * answer to be yes — a shared link that opens on the actual poster is the
 * point of sharing it. So it happens when the poster is generated, with a
 * plain notice on the page saying what is stored and for how long.
 *
 * WHAT BOUNDS IT
 * JPEG by magic bytes, the exact dimensions of the campaign's artwork (so an
 * arbitrary picture cannot be hosted here under this domain), a real campaign
 * slug, a byte ceiling, a per-address hourly limit, an unguessable id, and an
 * R2 lifecycle rule that deletes everything under cards/ after thirty days.
 * POSTER_CARDS_ENABLED=0 turns uploads off without a deploy.
 *
 * WHY A RAW BODY
 * A full-resolution poster is 1–3MB. Base64 inside JSON would inflate that by a
 * third and push against Vercel's ~4.5MB request cap, so the bytes are sent
 * as-is: a 4-byte big-endian card length, the card, then the poster.
 */

export const config = { api: { bodyParser: false } }

const CARD_W = 1200
const CARD_H = 630
const MAX_CARD = 450 * 1024
const MAX_POSTER = 4 * 1024 * 1024
/** Under Vercel's request limit with room for headers. */
const MAX_BODY = 4.4 * 1024 * 1024

const RATE_LIMIT = 12 // per address per hour

function addressKey(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = fwd || req.socket?.remoteAddress || 'unknown'
  return createHash('sha256')
    .update(`${process.env.R2_ACCOUNT_ID || ''}:${ip}`)
    .digest('hex')
    .slice(0, 24)
}

/** Read the raw body, refusing — early — anything over the cap. */
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(req.body)) return resolve(req.body)
    const declared = Number(req.headers['content-length'] || 0)
    if (declared > limit) {
      const err = new Error('too large')
      err.status = 413
      return reject(err)
    }
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        const err = new Error('too large')
        err.status = 413
        req.destroy()
        reject(err)
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (process.env.POSTER_CARDS_ENABLED === '0') {
    return res.status(503).json({ error: 'Sharing is turned off at the moment. You can still download your poster.' })
  }
  if (!r2Config()) {
    return res.status(501).json({ error: 'Poster storage is not configured.' })
  }

  const slug = String(req.query.slug || '').slice(0, 64)
  const poster = /^[a-z0-9-]+$/.test(slug) ? posterBySlug(slug) : null
  if (!poster) return res.status(400).json({ error: 'Unknown poster.' })

  let body
  try {
    body = await readBody(req, MAX_BODY)
  } catch (err) {
    return res.status(err.status || 400).json({ error: 'That poster is too large to share. Download it instead.' })
  }
  if (body.length < 8) return res.status(400).json({ error: 'Nothing was sent.' })

  const cardLen = body.readUInt32BE(0)
  if (cardLen < 100 || cardLen > MAX_CARD || 4 + cardLen >= body.length) {
    return res.status(400).json({ error: 'The upload was malformed.' })
  }
  const card = body.subarray(4, 4 + cardLen)
  const full = body.subarray(4 + cardLen)

  if (!isJpeg(card) || !isJpeg(full)) return res.status(415).json({ error: 'Both images must be JPEGs.' })
  if (full.length > MAX_POSTER) return res.status(413).json({ error: 'That poster is too large to share.' })

  const cardSize = imageSize(card)
  if (!cardSize || cardSize.w !== CARD_W || cardSize.h !== CARD_H) {
    return res.status(400).json({ error: `The preview must be ${CARD_W}x${CARD_H}.` })
  }
  // Exactly the campaign's own artwork size: the page can only produce that,
  // and anything else is not a poster made here.
  const fullSize = imageSize(full)
  if (!fullSize || fullSize.w !== poster.width || fullSize.h !== poster.height) {
    return res.status(400).json({ error: 'That is not a poster from this page.' })
  }

  const who = addressKey(req)
  const hour = new Date().toISOString().slice(0, 13)
  const rlPrefix = `rl/${hour}/${who}/`
  try {
    const seen = await r2List(rlPrefix, RATE_LIMIT + 1)
    if (seen.length >= RATE_LIMIT) {
      res.setHeader('Retry-After', '3600')
      return res.status(429).json({ error: 'Too many posters from this connection. Try again in an hour — you can still download yours.' })
    }
  } catch {
    // A failure to count must not become a failure to share.
  }

  const id = randomBytes(16).toString('base64url') // 128 bits, unguessable
  try {
    await Promise.all([r2Put(`cards/${id}.jpg`, card, 'image/jpeg'), r2Put(`cards/${id}-p.jpg`, full, 'image/jpeg')])
    r2Put(`${rlPrefix}${Date.now().toString(36)}`, Buffer.from('1'), 'text/plain').catch(() => {})
  } catch (err) {
    console.error('poster upload failed:', err)
    return res.status(502).json({ error: 'The poster could not be saved just now. Download it, or try sharing again.' })
  }

  return res.status(200).json({ id })
}
