/**
 * What the admin panel publishes to iTDP Telangana (itdptelangana.com), and
 * the rules every edit has to pass before it is committed there.
 *
 * Programmes live in the iTDP repository as two kinds of file:
 *   src/data/programs.js          the index — every programme, no photo lists
 *   src/data/albums/<slug>.js     one programme's photographs
 * so the site's main bundle stays small however many photos are added. The
 * photographs themselves are in the media bucket (server/itdp-media.js).
 *
 * The file headers below are the same text itdp-telangana/scripts/
 * import-old-site.mjs writes — keep the two in step.
 *
 * VALIDATION IS THE SECURITY BOUNDARY: anything accepted is published on a
 * party website, so every field has a type and a length cap, unknown fields
 * are dropped, and photo keys must sit under the programme's own folder.
 */
import { parseDataModule, serializeDataModule } from './data-module.js'

export const PROGRAMS_PATH = 'src/data/programs.js'
export const albumPath = (slug) => `src/data/albums/${slug}.js`

export const PROGRAMS_HEADER = `/**
 * Programmes, newest first: title, date, venue, description, cover and videos.
 * Each programme's photos are in src/data/albums/<slug>.js.
 *
 * WRITTEN BY THE ADMIN PANEL (admin.talikotaharikrishna.com > ITDP Telangana >
 * Programmes) — do not edit by hand. Everything after \`export default\` must
 * stay plain JSON: it is parsed back as JSON on the next edit.
 *
 * date           YYYY-MM-DD; with datePrecision "month" or "year" only that
 *                much of it is shown, and it is used for sorting
 * dateConfirmed  false for dates inferred when importing the old site
 * time           optional start time, HH:MM (India); a programme dated today
 *                or later is shown as Upcoming, with its time
 * cover.k        object key in the media bucket, served at /media/<k>
 */`

export const ALBUM_HEADER = `/**
 * One programme's photographs, in display order.
 *
 * WRITTEN BY THE ADMIN PANEL — do not edit by hand; plain JSON after
 * \`export default\`. k is the media-bucket key (served at /media/<k>, with a
 * 480px thumbnail at <name>-t.jpg); w/h are pixels, b is bytes.
 */`

export const PROGRAM_SLUG = /^[a-z0-9][a-z0-9-]{1,79}$/
export const PHOTO_ID = /^[a-z0-9][a-z0-9-]{0,60}$/
const MAX_PHOTOS = 1500

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

const int = (v, lo, hi) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null
}

export const parsePrograms = (text) => {
  const m = text ? parseDataModule(text) : {}
  return { programs: Array.isArray(m.programs) ? m.programs : [] }
}
export const serializePrograms = (m) => serializeDataModule(m, PROGRAMS_HEADER)

export const parseAlbum = (text) => {
  const m = text ? parseDataModule(text) : {}
  return { slug: m.slug, photos: Array.isArray(m.photos) ? m.photos : [] }
}
export const serializeAlbum = (slug, photos) => serializeDataModule({ slug, photos }, ALBUM_HEADER)

/** A photo reference, checked to live under this programme's folder. */
function photo(p, slug, label) {
  const k = String(p?.k || '')
  const re = new RegExp(`^programs/${slug}/[a-z0-9][a-z0-9-]{0,60}\\.jpg$`)
  if (!re.test(k)) throw new Invalid(`${label} is not one of this programme's uploads. Upload it again.`)
  const w = int(p.w, 1, 12000)
  const h = int(p.h, 1, 12000)
  const b = int(p.b, 1, 40 * 1024 * 1024)
  if (!w || !h || !b) throw new Invalid(`${label} is missing its size. Upload it again.`)
  return { k, w, h, b }
}

/** A video link, as the site stores it. */
function video(v, label) {
  const provider = v?.provider === 'vimeo' ? 'vimeo' : v?.provider === 'youtube' ? 'youtube' : null
  const id = String(v?.id || '')
  if (provider === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(id)) return { provider, id }
  if (provider === 'vimeo' && /^\d{4,12}$/.test(id)) return { provider, id }
  throw new Invalid(`${label} is not a YouTube or Vimeo video link.`)
}

/**
 * Clean a programme sent by the panel. Throws with a message fit to show the
 * office. `existing` is the published entry when editing.
 */
export function sanitizeProgram(body, existing) {
  const slug = String(existing?.slug || body?.slug || '')
  if (!PROGRAM_SLUG.test(slug)) throw new Invalid('The web address must be lowercase letters, numbers and hyphens.')

  const title = str(body?.title, 140, 'The title')
  if (title.length < 3) throw new Invalid('Give the programme a title of at least 3 characters.')

  const date = str(body?.date, 10, 'The date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) throw new Invalid('Choose the date of the programme.')
  const datePrecision = ['day', 'month', 'year'].includes(body?.datePrecision) ? body.datePrecision : 'day'
  // Optional start time, 24-hour HH:MM, India time. Only meaningful with an
  // exact day, so dropped otherwise.
  const time = str(body?.time, 5, 'The time')
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Invalid('Give the time as hours and minutes, e.g. 18:30.')

  const photos = (Array.isArray(body?.photos) ? body.photos : []).map((p, i) => photo(p, slug, `Photo ${i + 1}`))
  if (photos.length > MAX_PHOTOS) throw new Invalid(`Keep an album to ${MAX_PHOTOS} photos or fewer.`)
  if (new Set(photos.map((p) => p.k)).size !== photos.length) throw new Invalid('The same photo is in the album twice.')

  const cover = body?.cover ? photo(body.cover, slug, 'The cover photo') : photos[0] || null

  const videos = (Array.isArray(body?.videos) ? body.videos : []).slice(0, 12).map((v, i) => video(v, `Video ${i + 1}`))

  const now = new Date().toISOString()
  return {
    entry: {
      slug,
      title,
      titleTe: str(body?.titleTe, 140, 'The Telugu title'),
      date,
      datePrecision,
      ...(time && datePrecision === 'day' ? { time } : {}),
      // Saving from the panel is somebody in the office standing behind the
      // date, unless they have said otherwise.
      dateConfirmed: body?.dateConfirmed !== false,
      venue: str(body?.venue, 140, 'The venue'),
      description: str(body?.description, 4000, 'The description'),
      descriptionTe: str(body?.descriptionTe, 4000, 'The Telugu description'),
      cover,
      videos,
      publishedAt: existing?.publishedAt || now,
      ...(existing ? { updatedAt: now } : {}),
      photoCount: photos.length,
      photoBytes: photos.reduce((n, p) => n + p.b, 0),
    },
    photos,
  }
}

/** Newest first, then most recently published — the order the site shows. */
export const sortPrograms = (list) =>
  list.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.publishedAt).localeCompare(String(a.publishedAt)))

/** Bytes of photographs the index says are stored, covers included. */
export const storedBytes = (programs) => programs.reduce((n, p) => n + (Number(p.photoBytes) || 0) + (Number(p.cover?.b) || 0), 0)
