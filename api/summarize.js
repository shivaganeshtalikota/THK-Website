import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Turns pasted source text into a short caption for the admin panel.
 *
 * OPTIONAL BY DESIGN. If GEMINI_API_KEY is not set this returns 501 and the
 * panel keeps working with the caption typed by hand — the toggle in the UI is
 * off by default and the field is always editable afterwards. Nothing is ever
 * published without someone reading it: the summary lands in the textarea, not
 * in the commit.
 *
 * That matters more than usual here. This is a real politician's site, and a
 * model paraphrasing a news article can quietly introduce a claim the article
 * did not make. The prompt is therefore constrained to description rather than
 * inference, and the result is a draft for a human to approve.
 *
 * Environment:
 *   GEMINI_API_KEY   optional; without it the feature reports unavailable. Set
 *                    it in Vercel, never in the repository — this one is public.
 *   ADMIN_PASSWORD   same credential as the publish endpoint
 *   ADMIN_ID         optional second factor, as in publish.js
 */

// Gemini rather than Anthropic: the office asked for it, and the free tier
// covers the handful of captions this endpoint will ever draft.
const MODEL = 'gemini-flash-latest'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const MAX_INPUT = 12000

const INSTRUCTION = [
  'You write captions for the official website of Talikota Hari Krishna, an Indian politician:',
  'Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam and iTDP Telangana State',
  'President of the Telugu Desam Party.',
  '',
  'Write ONE caption of 25 to 45 words describing what the supplied text reports.',
  'Rules, in order of importance:',
  '1. State only what the source states. Never add a claim, a number, a date or a role that is',
  '   not in the text. If the text does not say he was present, do not imply he was.',
  '2. Neutral, factual register. No praise, no campaign language, no adjectives of approval.',
  '3. Plain English. Keep Telugu names and place names as given.',
  '4. Reply with the caption alone - no preamble, no quotation marks.',
].join('\n')

const constantEquals = (given, expected) => {
  if (typeof given !== 'string' || !expected) return false
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/**
 * Brute-force resistance for a password-protected endpoint on the open web.
 *
 * There is no shared store here — serverless instances do not see each other —
 * so this cannot be a true global rate limit. It does two things that matter
 * anyway:
 *
 *  1. Every REJECTED attempt costs a fixed second. Credential stuffing depends
 *     on volume; at one second per try a strong password is out of reach, and a
 *     legitimate user typing a wrong password never notices.
 *  2. A per-instance counter locks an IP out for fifteen minutes after ten
 *     failures, which stops one warm instance being hammered.
 *
 * Both are cheap. Neither replaces a long random ADMIN_PASSWORD, which is what
 * actually protects this.
 */
const ATTEMPTS = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 10

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown'

const lockedOut = (ip) => {
  const rec = ATTEMPTS.get(ip)
  if (!rec) return false
  if (Date.now() - rec.first > WINDOW_MS) {
    ATTEMPTS.delete(ip)
    return false
  }
  return rec.count >= MAX_FAILURES
}

const noteFailure = (ip) => {
  const rec = ATTEMPTS.get(ip)
  if (!rec || Date.now() - rec.first > WINDOW_MS) ATTEMPTS.set(ip, { count: 1, first: Date.now() })
  else rec.count += 1
}

const penalty = () => new Promise((r) => setTimeout(r, 1000))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { GEMINI_API_KEY, ADMIN_PASSWORD, ADMIN_ID } = process.env
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server is not configured.' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
  const { adminId, password, text, title } = body

  const ip = clientIp(req)
  if (lockedOut(ip)) {
    await penalty()
    return res.status(429).json({ error: 'Too many attempts. Try again in fifteen minutes.' })
  }
  if ((ADMIN_ID && !constantEquals(adminId, ADMIN_ID)) || !constantEquals(password, ADMIN_PASSWORD)) {
    noteFailure(ip)
    await penalty()
    return res.status(401).json({ error: 'Wrong ID or password.' })
  }
  ATTEMPTS.delete(ip)
  if (!GEMINI_API_KEY) {
    return res.status(501).json({
      error:
        'Summarising is not switched on. Add GEMINI_API_KEY in Vercel to enable it, or write the caption yourself.',
    })
  }
  if (!text || String(text).trim().length < 40) {
    return res.status(400).json({ error: 'Paste at least a couple of sentences to summarise.' })
  }

  const prompt = [
    title ? `Working title: ${title}` : null,
    'Source text:',
    String(text).slice(0, MAX_INPUT),
  ]
    .filter(Boolean)
    .join('\n\n')

  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // A header rather than a query parameter, so the key never lands in a
      // URL that a proxy or CDN might log.
      'X-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // Flash spends output budget on thinking tokens before it writes, so a
        // 300-token cap returned a caption cut off after six words. The budget
        // is switched off — this is a paraphrase, not a reasoning task — and the
        // cap raised well clear of a 45-word answer.
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 800,
        temperature: 0.2,
      },
    }),
  }

  try {
    // The free tier returns 503 UNAVAILABLE and 429 intermittently — observed
    // repeatedly while building this, on requests that succeed moments later.
    // One attempt would surface that to the user as a failure they cannot act
    // on, so transient statuses are retried with a short backoff. 4xx other
    // than 429 is a real error and is not retried.
    let r
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(ENDPOINT, request)
      if (r.ok || ![429, 500, 502, 503, 504].includes(r.status)) break
      if (attempt < 2) await new Promise((s) => setTimeout(s, 600 * (attempt + 1)))
    }

    if (!r.ok) {
      const detail = await r.text()
      console.error('gemini error', r.status, detail.slice(0, 300))
      return res
        .status(502)
        .json({ error: 'The summariser did not respond. Write the caption by hand.' })
    }

    const data = await r.json()
    const candidate = data.candidates?.[0]
    // A truncated caption is worse than none: it would be published as a
    // sentence that stops mid-clause.
    if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
      console.error('gemini finishReason', candidate.finishReason)
      return res
        .status(502)
        .json({ error: 'The summariser stopped early. Write the caption by hand.' })
    }
    const summary = (candidate?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join(' ')
      .replace(/^["“]|["”]$/g, '')
      .trim()

    if (!summary) {
      return res
        .status(502)
        .json({ error: 'The summariser returned nothing. Write the caption by hand.' })
    }
    return res.status(200).json({ ok: true, summary })
  } catch (err) {
    console.error('summarize failed:', err)
    return res.status(502).json({ error: 'The summariser could not be reached.' })
  }
}
