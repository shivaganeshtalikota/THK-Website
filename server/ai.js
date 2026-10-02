/**
 * Gemini, for the office console: reading an image or a piece of text and
 * filling in the form fields an editor would otherwise type by hand.
 *
 *   readImage('poster')   artwork        -> titles (English and Telugu), tag, date, summary
 *   readImage('photo')    a photograph   -> title, caption, gallery category
 *   readImage('cutting')  a news cutting -> paper, date, page, headline, summary, topic
 *   readImage('event')    an invitation  -> title, date, time, venue, description (both languages)
 *   translate()           English <-> Telugu, for every paired field in the console
 *
 * NOTHING HERE PUBLISHES. Every answer goes into the form, where a person reads
 * it and decides — the same rule as the caption drafting in summarize.js. And
 * every prompt says the same thing first: state only what the image or the
 * text shows. A console that invents a date or a role for a real politician
 * is worse than one that leaves the box empty, so an empty string is always
 * an acceptable answer.
 *
 * Environment: GEMINI_API_KEY (the same key as caption drafting). Without it
 * every call explains that the feature is switched off.
 */

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
// A stand-in endpoint for local testing only; never honoured on Vercel.
const BASE = (!process.env.VERCEL && process.env.GEMINI_TEST_ENDPOINT) || 'https://generativelanguage.googleapis.com'
const ENDPOINT = `${BASE}/v1beta/models/${MODEL}:generateContent`

export class AiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    // Written for the office to read: the console shows it as it is.
    this.expose = true
  }
}

export const aiReady = () => Boolean(process.env.GEMINI_API_KEY)

const WHO = [
  'You help the office of Talikota Hari Krishna fill in its website console. He is a Telugu Desam Party (TDP)',
  'leader from Hyderabad, Telangana; a Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam (the',
  'Sri Kanaka Durga Temple, Indrakeeladri, Vijayawada); and iTDP Telangana State President.',
  'Standard spellings: Talikota Hari Krishna = తాళికోట హరికృష్ణ; Telugu Desam Party = తెలుగుదేశం పార్టీ;',
  'Sri Kanaka Durga Temple = శ్రీ కనకదుర్గ ఆలయం; N. Chandrababu Naidu = నారా చంద్రబాబు నాయుడు; Nara Lokesh = నారా లోకేష్.',
].join('\n')

const RULES = [
  'Rules, in order of importance:',
  '1. Use only what the image or text actually shows. Never invent a name, a number, a date, a place or a role.',
  '   If something is not there, return an empty string for it.',
  '2. Neutral, factual wording. No praise and no campaign slogans of your own.',
  '3. Telugu in Telugu script, natural and idiomatic, not word-for-word. English in plain British spelling.',
].join('\n')

const str = { type: 'STRING' }
const schema = (props) => ({ type: 'OBJECT', properties: Object.fromEntries(props.map((p) => [p, str])), required: props })

const TASKS = {
  poster: {
    max: 900,
    instruction: [
      WHO,
      '',
      'The image is the artwork of a campaign or greeting poster. Supporters put their own photo and name on it',
      'and share it. Read it and return:',
      '- titleEn: a short English title for the poster, at most 60 characters, sentence case, naming the occasion',
      '  or the demand, e.g. "Gandhi Jayanti greetings" or "Stop the fake fertiliser racket".',
      '- title: the main Telugu headline exactly as printed on the artwork, on one line. If there is no Telugu',
      '  headline, a natural Telugu title of the same meaning as titleEn.',
      '- issue: a tag of one to three English words, at most 24 characters, e.g. "Gandhi Jayanti", "Farmers".',
      '- date: only if a date is printed on the artwork, written like "2 October 2026". Otherwise empty.',
      '- summary: one or two plain English sentences, at most 300 characters, saying what the poster says.',
      '',
      RULES,
    ].join('\n'),
    fields: ['titleEn', 'title', 'issue', 'date', 'summary'],
  },
  photo: {
    max: 700,
    instruction: [
      WHO,
      '',
      'The image is a photograph for the gallery on his website. Describe what is visible and return:',
      '- title: a short title, at most 70 characters.',
      '- caption: one or two sentences, at most 220 characters, saying what is happening in the photograph.',
      '- category: exactly one of party, constituency, temple, culture — party for party meetings and leaders,',
      '  constituency for local programmes and public meetings, temple for temples and religious occasions,',
      '  culture for festivals, dance and music.',
      'Name a person only if the office’s note names them or their name is written in the photograph. Do not',
      'guess who anyone is from their face.',
      'Write title and caption in the language asked for.',
      '',
      RULES,
    ].join('\n'),
    fields: ['title', 'caption', 'category'],
  },
  cutting: {
    max: 1100,
    instruction: [
      WHO,
      '',
      'The image is a newspaper cutting, a screenshot of an e-paper, or a news website. Read it and return:',
      '- paper: the newspaper or channel name in English, as on its masthead, e.g. "Eenadu", "Andhra Jyothy",',
      '  "Sakshi", "Namasthe Telangana", "Mana Telangana", "Deccan Chronicle". Empty if not visible.',
      '- date: the publication date as YYYY-MM-DD, only if it is printed. Otherwise empty.',
      '- page: the page number, digits only, only if printed. Otherwise empty.',
      '- headline: the headline exactly as printed, in its own language, on one line.',
      '- summary: one or two plain English sentences, at most 300 characters, saying what the report says about',
      '  Talikota Hari Krishna (also printed as Harikrishna, Hari Krishna, T. Harikrishna or హరికృష్ణ). If he is',
      '  not mentioned, say what the report is about.',
      '- topic: exactly one of dumping-yard (the Jawahar Nagar dumping yard), nagaram-divisions (municipal',
      '  divisions for Nagaram), temple (the Kanaka Durga temple board), party (party work), community (anything else).',
      '',
      RULES,
    ].join('\n'),
    fields: ['paper', 'date', 'page', 'headline', 'summary', 'topic'],
  },
  event: {
    max: 1100,
    instruction: [
      WHO,
      '',
      'The image (or text) is an invitation or announcement for a programme he will attend or organise. Return,',
      'in both English and Telugu:',
      '- titleEn, titleTe: the name of the programme.',
      '- date: as YYYY-MM-DD, only if printed. Otherwise empty.',
      '- time: as HH:MM in 24-hour time, only if printed. Otherwise empty.',
      '- venueEn, venueTe: the place, as printed.',
      '- descriptionEn, descriptionTe: one sentence on what the programme is.',
      '',
      RULES,
    ].join('\n'),
    fields: ['titleEn', 'titleTe', 'date', 'time', 'venueEn', 'venueTe', 'descriptionEn', 'descriptionTe'],
  },
}

const TRANSLATE = [
  WHO,
  '',
  'Translate the text you are given into the language asked for, for his official website. Keep the meaning',
  'exactly; do not add or drop anything. Use the standard spellings above for names. A title stays short like a',
  'headline; a sentence stays a sentence. Return only the translation in the "text" field.',
].join('\n')

async function generate({ instruction, parts, fields, max, cap = 600, keepLines = false }) {
  const { GEMINI_API_KEY } = process.env
  if (!GEMINI_API_KEY) {
    throw new AiError(501, 'Gemini is switched off: GEMINI_API_KEY is not set in Vercel. Fill the fields in by hand.')
  }
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema(fields),
        // A form fill, not a puzzle: thinking would only spend the output
        // budget and slow the button down.
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: max,
        temperature: 0.2,
      },
    }),
  }

  let r
  try {
    // The free tier answers 429/503 now and then for a request that succeeds
    // a moment later.
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(ENDPOINT, request)
      if (r.ok || ![429, 500, 502, 503, 504].includes(r.status)) break
      if (attempt < 2) await new Promise((s) => setTimeout(s, 700 * (attempt + 1)))
    }
    // A model that cannot switch thinking off refuses the request outright.
    // "latest" can move to such a model at any time, so ask again without
    // the setting, with room in the budget for the thinking it will do.
    if (r.status === 400) {
      const detail = await r.clone().text()
      if (/thinking/i.test(detail)) {
        const body = JSON.parse(request.body)
        delete body.generationConfig.thinkingConfig
        body.generationConfig.maxOutputTokens = max + 4096
        r = await fetch(ENDPOINT, { ...request, body: JSON.stringify(body) })
      }
    }
  } catch (err) {
    console.error('gemini unreachable:', err)
    throw new AiError(502, 'Gemini could not be reached. Try again in a moment, or fill it in by hand.')
  }
  if (r.status === 429) throw new AiError(429, 'Gemini is busy (the free allowance is used up for now). Try again in a minute.')
  if (!r.ok) {
    console.error('gemini error', r.status, (await r.text()).slice(0, 400))
    throw new AiError(502, 'Gemini did not answer. Try again, or fill it in by hand.')
  }
  const data = await r.json()
  const c = data.candidates?.[0]
  if (!c || (c.finishReason && !['STOP', 'MAX_TOKENS'].includes(c.finishReason))) {
    throw new AiError(502, 'Gemini declined to read that. Fill it in by hand.')
  }
  const text = (c.content?.parts ?? []).map((p) => p.text ?? '').join('')
  let out
  try {
    out = JSON.parse(text)
  } catch {
    throw new AiError(502, 'Gemini’s answer was cut off. Try again.')
  }
  // Only the fields asked for, only strings, trimmed and capped.
  const clean = (v) => (keepLines ? v.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : v.replace(/\s+/g, ' ')).trim().slice(0, cap)
  return Object.fromEntries(fields.map((f) => [f, typeof out?.[f] === 'string' ? clean(out[f]) : '']))
}

const MIME = (buf) =>
  buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' : buf[0] === 0x89 && buf[1] === 0x50 ? 'image/png' : buf.slice(0, 4).toString() === 'RIFF' ? 'image/webp' : null

/**
 * Read an image for one of the TASKS. `note` is what the office typed to help
 * (who is in a photo, say); `lang` is the language a photo caption is wanted in.
 */
export async function readImage(task, buf, { note = '', lang = 'en', text = '' } = {}) {
  const t = TASKS[task]
  if (!t) throw new AiError(400, 'Unknown task.')
  const parts = []
  if (buf) {
    const mimeType = MIME(buf)
    if (!mimeType) throw new AiError(415, 'That is not a JPEG, PNG or WebP image.')
    parts.push({ inlineData: { mimeType, data: buf.toString('base64') } })
  }
  if (text) parts.push({ text: `Text of the invitation or announcement:\n${String(text).slice(0, 6000)}` })
  if (!parts.length) throw new AiError(400, 'Nothing to read.')
  if (note) parts.push({ text: `Note from the office: ${String(note).slice(0, 500)}` })
  if (task === 'photo') parts.push({ text: `Write the title and caption in ${lang === 'te' ? 'Telugu' : 'English'}.` })
  const out = await generate({ ...t, parts })
  // Keep the closed choices closed: a category or topic the site does not
  // have would save, and then not show anywhere.
  if (task === 'photo' && !['party', 'constituency', 'temple', 'culture'].includes(out.category)) out.category = ''
  if (task === 'cutting' && !['dumping-yard', 'nagaram-divisions', 'party', 'temple', 'community'].includes(out.topic)) out.topic = ''
  if ((task === 'cutting' || task === 'event') && out.date && !/^\d{4}-\d{2}-\d{2}$/.test(out.date)) out.date = ''
  if (task === 'event' && out.time && !/^\d{2}:\d{2}$/.test(out.time)) out.time = ''
  if (task === 'cutting') out.page = out.page.replace(/\D/g, '').slice(0, 2)
  return out
}

/** English <-> Telugu. `kind` says whether it is a title or running text. */
export async function translate(text, to, kind = 'text') {
  const src = String(text || '').trim()
  if (!src) throw new AiError(400, 'There is nothing to translate yet.')
  if (src.length > 4000) throw new AiError(413, 'That is too long to translate in one go.')
  const lang = to === 'te' ? 'Telugu' : 'English'
  const out = await generate({
    instruction: TRANSLATE,
    parts: [{ text: `Translate this ${kind === 'title' ? 'title' : 'text'} into ${lang}:\n\n${src}` }],
    fields: ['text'],
    max: Math.min(4000, 200 + src.length * 4),
    cap: 6000,
    keepLines: true,
  })
  if (!out.text) throw new AiError(502, 'Gemini returned no translation. Try again.')
  return out.text
}
