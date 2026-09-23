/**
 * The parts of the site the office edits from the admin panel, and the rules
 * every edit has to pass before it is committed.
 *
 * Stored in src/data/site-content.js (a JS module around plain JSON — see
 * server/data-module.js) and read by the site at build time, so an edit is
 * prerendered into real HTML like everything else rather than patched in by
 * JavaScript after the page loads.
 *
 * VALIDATION IS THE SECURITY BOUNDARY HERE. Anything accepted is published on
 * a politician's site. So every field has a type, a length cap and — for links
 * — an allowed scheme; unknown fields are dropped rather than passed through;
 * and page-text overrides are only accepted for strings the site actually
 * uses, so the file cannot become a place to store arbitrary content. React
 * escapes everything it renders, so none of this is HTML; the caps are about
 * keeping the published site sane.
 */
import { serializeDataModule } from './data-module.js'

export const SITE_CONTENT_PATH = 'src/data/site-content.js'

export const SITE_CONTENT_HEADER = `/**
 * Site content edited from the admin panel: the announcement bar, events and
 * programmes, contact details, social accounts, and page-text overrides.
 *
 * WRITTEN BY api/admin.js — do not edit by hand. Everything after the default
 * export must stay plain JSON; it is parsed back as JSON on the next edit.
 * See server/site-content.js for what each field accepts.
 */`

export const EMPTY_SITE_CONTENT = {
  announcement: { enabled: false, en: '', te: '', link: '', linkEn: '', linkTe: '', tone: 'brand', until: '' },
  events: [],
  contact: {},
  social: null,
  text: {},
}

export const serializeSiteContent = (value) => serializeDataModule(value, SITE_CONTENT_HEADER)

class Invalid extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

const str = (v, max, label) => {
  const s = String(v ?? '').replace(/\r\n?/g, '\n').trim()
  if (s.length > max) throw new Invalid(`${label} is too long (${s.length} of ${max} characters).`)
  return s
}

const bool = (v) => v === true || v === 'true' || v === 1

/** https:// links, or a path on this site. Nothing else — no javascript:. */
const link = (v, label) => {
  const s = str(v, 400, label)
  if (!s) return ''
  if (/^\/(?!\/)[^\s]*$/.test(s)) return s
  let u
  try {
    u = new URL(s)
  } catch {
    throw new Invalid(`${label} is not a valid web address.`)
  }
  if (u.protocol !== 'https:') throw new Invalid(`${label} must start with https://`)
  return u.toString()
}

const date = (v, label) => {
  const s = str(v, 10, label)
  if (!s) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) {
    throw new Invalid(`${label} must be a date.`)
  }
  return s
}

const time = (v, label) => {
  const s = str(v, 5, label)
  if (!s) return ''
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Invalid(`${label} must be a time like 18:30.`)
  return s
}

const email = (v, label) => {
  const s = str(v, 120, label)
  if (!s) return ''
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s)) throw new Invalid(`${label} is not a valid email address.`)
  return s
}

const phone = (v, label) => {
  const s = str(v, 24, label)
  if (!s) return ''
  if (!/^\+?[0-9 ()-]{6,24}$/.test(s)) throw new Invalid(`${label} may contain only digits, spaces, + ( ) and -.`)
  return s
}

const eventId = (v) => {
  const s = String(v || '')
  return /^[a-z0-9-]{4,60}$/.test(s) ? s : `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Clean one section of the site content. Throws an Error with .status 400 and
 * a message fit to show the office when something is wrong.
 *
 * @param {'announcement'|'events'|'contact'|'social'|'text'} section
 * @param {unknown} value
 * @param {{knownText?: Set<string>}} ctx
 */
export function sanitizeSection(section, value, ctx = {}) {
  switch (section) {
    case 'announcement': {
      const v = value || {}
      const out = {
        enabled: bool(v.enabled),
        en: str(v.en, 220, 'The English announcement'),
        te: str(v.te, 220, 'The Telugu announcement'),
        link: link(v.link, 'The announcement link'),
        linkEn: str(v.linkEn, 40, 'The link label'),
        linkTe: str(v.linkTe, 40, 'The Telugu link label'),
        tone: ['brand', 'dark', 'alert'].includes(v.tone) ? v.tone : 'brand',
        until: date(v.until, 'The end date'),
      }
      if (out.enabled && !out.en && !out.te) throw new Invalid('Write the announcement before switching it on.')
      return out
    }

    case 'events': {
      if (!Array.isArray(value)) throw new Invalid('Events must be a list.')
      if (value.length > 60) throw new Invalid('Keep it to 60 events or fewer — remove old ones first.')
      return value.map((e, i) => {
        const n = `Event ${i + 1}`
        const out = {
          id: eventId(e?.id),
          titleEn: str(e?.titleEn, 140, `${n}: English title`),
          titleTe: str(e?.titleTe, 140, `${n}: Telugu title`),
          date: date(e?.date, `${n}: date`),
          time: time(e?.time, `${n}: time`),
          venueEn: str(e?.venueEn, 140, `${n}: venue`),
          venueTe: str(e?.venueTe, 140, `${n}: Telugu venue`),
          descriptionEn: str(e?.descriptionEn, 700, `${n}: description`),
          descriptionTe: str(e?.descriptionTe, 700, `${n}: Telugu description`),
          link: link(e?.link, `${n}: link`),
        }
        if (!out.titleEn && !out.titleTe) throw new Invalid(`${n} needs a title.`)
        if (!out.date) throw new Invalid(`${n} needs a date.`)
        return out
      })
    }

    case 'contact': {
      const v = value || {}
      return {
        email: email(v.email, 'Email'),
        pressEmail: email(v.pressEmail, 'Press email'),
        phone: phone(v.phone, 'Phone'),
        whatsapp: phone(v.whatsapp, 'WhatsApp number'),
        office: str(v.office, 160, 'Office address'),
        officeTe: str(v.officeTe, 160, 'Telugu office address'),
        hours: str(v.hours, 100, 'Office hours'),
        hoursTe: str(v.hoursTe, 100, 'Telugu office hours'),
      }
    }

    case 'social': {
      if (value === null) return null
      if (!Array.isArray(value)) throw new Invalid('Social accounts must be a list.')
      if (value.length > 12) throw new Invalid('Twelve accounts at most.')
      return value.map((s, i) => {
        const n = `Account ${i + 1}`
        const out = {
          name: str(s?.name, 30, `${n}: name`),
          handle: str(s?.handle, 60, `${n}: handle`),
          url: link(s?.url, `${n}: link`),
          official: s?.official !== false,
          note: str(s?.note, 60, `${n}: note`),
        }
        if (!out.name || !out.url) throw new Invalid(`${n} needs a name and a link.`)
        if (out.url.startsWith('/')) throw new Invalid(`${n}: the link must be a full https:// address.`)
        return out
      })
    }

    case 'text': {
      const v = value && typeof value === 'object' ? value : {}
      const keys = Object.keys(v)
      if (keys.length > 600) throw new Invalid('Too many text changes at once.')
      const out = {}
      for (const k of keys) {
        if (ctx.knownText && !ctx.knownText.has(k)) {
          throw new Invalid('One of the edited texts is not used on the site any more. Reload and try again.')
        }
        const en = str(v[k]?.en, 3000, 'An English text')
        const te = str(v[k]?.te, 3000, 'A Telugu text')
        if (en || te) out[k] = { ...(en ? { en } : {}), ...(te ? { te } : {}) }
      }
      return out
    }

    default:
      throw new Invalid('Unknown section.')
  }
}
