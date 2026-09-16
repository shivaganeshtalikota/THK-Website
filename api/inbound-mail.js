import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Forwards mail sent to this domain into a real inbox.
 *
 * WHY THIS IS NEEDED AT ALL
 * Resend receives mail for the domain, but it has no standing forwarding rule —
 * inbound messages land in its dashboard and forwarding is a per-message action
 * somebody has to take. For a contact address on a politician's site that is not
 * good enough: the whole reason the address exists is so a stranger can ask for
 * a photograph of themselves to be taken down, and that request cannot sit in a
 * developer dashboard nobody opens. This closes the loop, so mail to
 * contact@ arrives where a person will actually see it.
 *
 * WHY THE SIGNATURE CHECK IS THE IMPORTANT PART
 * This endpoint sends email as a verified political domain. Left unauthenticated
 * it would be an open relay wearing his name: anyone could POST a shape that
 * looks like an inbound message and have this site emit mail that passes SPF and
 * DKIM for talikotaharikrishna.com. So every request is verified against Resend's
 * Svix signature before anything is sent, the timestamp is checked to stop a
 * captured request being replayed, and the comparison is constant-time.
 *
 * The raw body is read by hand, with bodyParser disabled, because the signature
 * covers the exact bytes sent. Parsing the JSON and re-serialising it changes key
 * order and whitespace and the signature then never matches — Resend's docs call
 * this out specifically, and it is the usual reason a webhook "mysteriously"
 * fails to verify.
 *
 * Environment (Vercel > Settings > Environment Variables — never in the repo,
 * which is public):
 *   RESEND_API_KEY          a sending key for the verified domain
 *   RESEND_WEBHOOK_SECRET   the whsec_... secret shown when the webhook is made
 *   INBOUND_FORWARD_TO      where mail should land, e.g. the office inbox
 *   INBOUND_FORWARD_FROM    optional; defaults to forward@talikotaharikrishna.com
 */

export const config = { api: { bodyParser: false } }

/** Reject anything older than this, so a captured request cannot be replayed. */
const TOLERANCE_SECONDS = 5 * 60

const DEFAULT_FROM = 'Website mail <forward@talikotaharikrishna.com>'

/** The exact bytes Resend signed. Anything re-serialised will not verify. */
async function readRaw(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

/**
 * Svix signature verification, by hand.
 *
 * The scheme: sign "<id>.<timestamp>.<body>" with HMAC-SHA256, keyed on the
 * base64-decoded half of the whsec_ secret, and compare base64 digests. The
 * header carries a space-separated list of "v1,<sig>" because a secret can be
 * rotated with an overlap, so any one matching is a pass.
 */
function verifySignature({ raw, headers, secret }) {
  const id = headers['svix-id']
  const timestamp = headers['svix-timestamp']
  const signature = headers['svix-signature']
  if (!id || !timestamp || !signature) return { ok: false, why: 'missing svix headers' }

  const sent = Number(timestamp)
  if (!Number.isFinite(sent)) return { ok: false, why: 'unreadable timestamp' }
  const drift = Math.abs(Math.floor(Date.now() / 1000) - sent)
  if (drift > TOLERANCE_SECONDS) return { ok: false, why: `timestamp ${drift}s out of tolerance` }

  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${raw.toString('utf8')}`)
    .digest('base64')
  const expectedBuf = Buffer.from(expected)

  for (const part of String(signature).split(' ')) {
    const candidate = part.includes(',') ? part.slice(part.indexOf(',') + 1) : part
    const candidateBuf = Buffer.from(candidate)
    // timingSafeEqual throws on a length mismatch, so that is checked first —
    // and a differing length is already a non-match.
    if (candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf)) {
      return { ok: true }
    }
  }
  return { ok: false, why: 'no signature matched' }
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/** First address in a from/to field, whatever shape Resend used. */
function addressOf(value) {
  if (!value) return ''
  const one = Array.isArray(value) ? value[0] : value
  if (typeof one === 'object') return String(one.address || one.email || '')
  const m = String(one).match(/<([^>]+)>/)
  return (m ? m[1] : String(one)).trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.INBOUND_FORWARD_TO
  if (!secret || !apiKey || !to) {
    console.error('inbound-mail: not configured')
    // 500 rather than 200: Resend retries, so a deploy that is mid-configuration
    // does not silently lose somebody's takedown request.
    return res.status(500).json({ error: 'Forwarding is not configured.' })
  }

  const raw = await readRaw(req)
  const check = verifySignature({ raw, headers: req.headers, secret })
  if (!check.ok) {
    console.warn('inbound-mail: rejected —', check.why)
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Unreadable payload' })
  }

  const data = event?.data ?? {}
  const from = addressOf(data.from)
  const recipient = addressOf(data.to)
  const forwardFrom = process.env.INBOUND_FORWARD_FROM || DEFAULT_FROM

  /*
   * Do not forward our own forwards.
   *
   * Without this, a bounce or an auto-reply arriving back at the domain gets
   * forwarded, which produces another message, which arrives, which gets
   * forwarded. Mail loops are quick and expensive and they are somebody's
   * afternoon to unpick, so the cheap check goes in first.
   */
  const forwardAddress = addressOf(forwardFrom).toLowerCase()
  if (from && forwardAddress && from.toLowerCase() === forwardAddress) {
    console.warn('inbound-mail: dropping a message from the forwarder itself')
    return res.status(200).json({ ok: true, skipped: 'loop' })
  }

  const subject = String(data.subject || '(no subject)').slice(0, 200)
  const text = data.text ? String(data.text) : ''
  const html = data.html ? String(data.html) : ''

  const header =
    `<p style="font:13px system-ui;color:#555;border-left:3px solid #ccc;padding-left:10px">` +
    `Forwarded from <strong>${esc(recipient || 'this website')}</strong><br>` +
    `From: ${esc(from || 'unknown')}<br>` +
    `Received: ${esc(data.created_at || '')}` +
    `</p><hr>`

  // If Resend sent only a reference rather than the content, say so plainly
  // instead of forwarding an empty message that looks like a bug.
  const body =
    html || (text ? `<pre style="white-space:pre-wrap;font:14px system-ui">${esc(text)}</pre>` : '') ||
    `<p><em>No message body was included. Open it in the Resend dashboard` +
      (data.id ? ` (id ${esc(data.id)})` : '') +
      `.</em></p>`

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: forwardFrom,
        to: [to],
        subject: `[${recipient || 'website'}] ${subject}`,
        html: header + body,
        // So hitting Reply in the office answers the person who wrote in,
        // rather than the forwarding address.
        ...(from ? { reply_to: from } : {}),
      }),
    })
    if (!resp.ok) {
      const detail = (await resp.text()).slice(0, 300)
      console.error('inbound-mail: forward failed', resp.status, detail)
      // Non-2xx makes Resend retry, which is what should happen — losing a
      // takedown request quietly is the one outcome worth avoiding.
      return res.status(502).json({ error: 'Forward failed' })
    }
  } catch (err) {
    console.error('inbound-mail: forward threw', err)
    return res.status(502).json({ error: 'Forward failed' })
  }

  return res.status(200).json({ ok: true })
}
