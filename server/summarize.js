/**
 * Drafts a short, factual caption from a pasted news report.
 *
 * Gemini rather than another provider because the office asked for it, and the
 * free tier covers the handful of captions this will ever draft. The draft is
 * put in the form for a person to read and edit — it is never published on its
 * own.
 *
 * Environment: GEMINI_API_KEY (optional; without it the button explains that
 * drafting is switched off).
 */

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

class SummaryError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function summarize(text, title) {
  const { GEMINI_API_KEY } = process.env
  if (!GEMINI_API_KEY) {
    throw new SummaryError(501, 'Drafting captions is switched off. Add GEMINI_API_KEY in Vercel, or write the caption yourself.')
  }
  if (!text || String(text).trim().length < 40) {
    throw new SummaryError(400, 'Paste at least a couple of sentences to summarise.')
  }

  const prompt = [title ? `Working title: ${String(title).slice(0, 200)}` : null, 'Source text:', String(text).slice(0, MAX_INPUT)]
    .filter(Boolean)
    .join('\n\n')

  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // A header rather than a query parameter, so the key never lands in a URL
      // that a proxy might log.
      'X-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // Thinking disabled: this is a paraphrase, and Flash otherwise spends
        // its output budget thinking and returns a caption cut off mid-clause.
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 800,
        temperature: 0.2,
      },
    }),
  }

  let r
  try {
    // The free tier returns 429/503 intermittently on requests that succeed a
    // moment later, so transient statuses are retried with a short backoff.
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(ENDPOINT, request)
      if (r.ok || ![429, 500, 502, 503, 504].includes(r.status)) break
      if (attempt < 2) await new Promise((s) => setTimeout(s, 600 * (attempt + 1)))
    }
  } catch (err) {
    console.error('summarize failed:', err)
    throw new SummaryError(502, 'The summariser could not be reached. Write the caption by hand.')
  }

  if (!r.ok) {
    console.error('gemini error', r.status, (await r.text()).slice(0, 300))
    throw new SummaryError(502, 'The summariser did not respond. Write the caption by hand.')
  }
  const data = await r.json()
  const candidate = data.candidates?.[0]
  // A truncated caption is worse than none: it would be published as a
  // sentence that stops mid-clause.
  if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
    throw new SummaryError(502, 'The summariser stopped early. Write the caption by hand.')
  }
  const summary = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join(' ')
    .replace(/^["“]|["”]$/g, '')
    .trim()
  if (!summary) throw new SummaryError(502, 'The summariser returned nothing. Write the caption by hand.')
  return summary
}
