import { createHash } from 'node:crypto'
import {
  audit,
  clearSession,
  completeEnrolment,
  deviceLabel,
  hostOk,
  housekeeping,
  issueSession,
  loadState,
  lockedOut,
  newEnrolment,
  noteFailure,
  originOk,
  passwordMatches,
  penalty,
  readAudit,
  readSession,
  regenerateRecoveryCodes,
  resetSecondFactor,
  signOutEverywhere,
  strongSecretConfigured,
  verifySecondFactor,
  MAX_DEVICES,
  addDevice,
  cleanDeviceName,
  deviceCount,
  listDevices,
  newDeviceEnrolment,
  removeDevice,
  renameDevice,
} from '../server/security.js'
import { r2Config, r2Delete, r2Get, r2Put } from '../server/r2.js'
import { githubReady, mutateFiles, readFiles } from '../server/github.js'
import { imageSize, isJpeg } from '../server/image.js'
import { MANIFEST_PATH, parseManifest, serializeManifest } from '../server/campaign-manifest.js'
import { parseDataModule } from '../server/data-module.js'
import {
  EMPTY_SITE_CONTENT,
  SITE_CONTENT_PATH,
  sanitizeSection,
  serializeSiteContent,
} from '../server/site-content.js'
import { sanitizeGeometry } from '../server/poster-geometry.js'
import { summarize } from '../server/summarize.js'
import { te } from '../src/i18n/te.js'

/**
 * The admin panel's API — every operation, behind one function.
 *
 * Reached as /api/admin?op=<name>, and only on admin.talikotaharikrishna.com:
 * the routing middleware refuses it on every other host, and this file checks
 * again, because a check that lives in one place is a check one refactor away
 * from not existing.
 *
 * WHY ONE FUNCTION. Vercel's Hobby plan caps a deployment's function count,
 * and one router also means one place where authentication happens: every
 * operation below declares the session stage it needs, and the handler
 * enforces it before the operation runs. No operation can forget to check.
 *
 * ORDER OF CHECKS, for every request:
 *   right host  ->  known operation  ->  right method  ->  (POST) own origin
 *   and the X-THK-Admin header  ->  security store reachable  ->  session at
 *   the required stage  ->  the operation's own validation.
 *
 * Environment (Vercel, never the repository — it is public):
 *   ADMIN_ID, ADMIN_PASSWORD      the sign-in pair
 *   ADMIN_SESSION_SECRET          optional, recommended: 32+ random characters
 *   GITHUB_TOKEN                  fine-grained PAT, Contents: read and write
 *   R2_*                          the bucket (sessions, 2FA, uploads, log)
 *   GEMINI_API_KEY                optional, for drafting captions
 */

export const config = { api: { bodyParser: false } }

const UPLOADS_PATH = 'src/data/uploads.json'
const UPLOAD_DIR = 'public/photos/uploads'
const POSTER_DIR = 'public/posters'

const MAX_JSON = 256 * 1024
const MAX_PART = 3.9 * 1024 * 1024
const MAX_PARTS = 8 // 31MB — above anything the panel sends
const CATEGORIES = ['party', 'constituency', 'temple', 'culture', 'press']

const KNOWN_TEXT = new Set(Object.keys(te))

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message)
}

/* -------------------------------------------------------------- bodies */

function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(req.body)) return resolve(req.body)
    if (Number(req.headers['content-length'] || 0) > limit) return reject(new HttpError(413, 'That is too large.'))
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        req.destroy()
        reject(new HttpError(413, 'That is too large.'))
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function readJson(req) {
  if (req.method !== 'POST') return {}
  const raw = await readRaw(req, MAX_JSON)
  if (!raw.length) return {}
  try {
    const v = JSON.parse(raw.toString('utf8'))
    return v && typeof v === 'object' ? v : {}
  } catch {
    throw new HttpError(400, 'The request could not be read.')
  }
}

/* ------------------------------------------------------------- uploads */

const UPLOAD_ID = /^[0-9a-z]{8,11}-[A-Za-z0-9_-]{8,32}$/

function checkUploadId(id) {
  if (!UPLOAD_ID.test(String(id))) fail(400, 'Bad upload id.')
  const ts = parseInt(String(id).split('-')[0], 36)
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 24 * 3600 * 1000) fail(400, 'That upload has expired. Choose the file again.')
}

/** Reassemble a staged upload. Parts are namespaced by session, so one
 *  session can never read or complete another's upload. */
async function readUpload(session, ref) {
  if (!ref || typeof ref !== 'object') return null
  checkUploadId(ref.id)
  const parts = Number(ref.parts)
  if (!Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS) fail(400, 'Bad upload.')
  const bufs = await Promise.all(
    Array.from({ length: parts }, (_, n) => r2Get(`staging/${session.sid}/${ref.id}/${n}`)),
  )
  if (bufs.some((b) => !b)) fail(400, 'The upload did not finish. Try again.')
  const buf = Buffer.concat(bufs)
  if (ref.sha256 && createHash('sha256').update(buf).digest('hex') !== ref.sha256) {
    fail(400, 'The upload was damaged on the way. Try again.')
  }
  return buf
}

async function dropUpload(session, ref) {
  if (!ref?.id || !Number.isInteger(Number(ref.parts))) return
  await Promise.all(
    Array.from({ length: Number(ref.parts) }, (_, n) => r2Delete(`staging/${session.sid}/${ref.id}/${n}`).catch(() => {})),
  )
}

const SIGNATURES = [
  { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
]
const detect = (buf) => SIGNATURES.find((s) => s.magic.every((b, i) => buf[i] === b)) ?? null

/* ------------------------------------------------------------- helpers */

const cleanSources = (list) =>
  (Array.isArray(list) ? list : [])
    .map((s) => ({ label: String(s?.label ?? '').trim().slice(0, 120), url: String(s?.url ?? '').trim() }))
    .filter((s) => /^https:\/\/[^\s]+$/i.test(s.url))
    .slice(0, 8)

/** ASCII slug; a Telugu-only title falls back to a short digest. */
function idSlug(value) {
  const raw = String(value ?? '')
  const ascii = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  if (ascii.replace(/[^a-z]/g, '').length >= 3) return ascii
  const digest = createHash('sha256').update(raw).digest('hex').slice(0, 8)
  return ascii ? `${ascii}-${digest}` : digest
}

const parseUploads = (text) => {
  const m = text ? JSON.parse(text) : {}
  m.photos ??= []
  m.updates ??= []
  return m
}
const serializeUploads = (m) => `${JSON.stringify(m, null, 2)}\n`
const parsePosters = (text) => (text ? parseManifest(text) : { posters: [] })
const parseSite = (text) => ({ ...EMPTY_SITE_CONTENT, ...(text ? parseDataModule(text) : {}) })

/** A correct code that was just used. Not counted as a failure: it is the
 *  owner, a few seconds early for the next code. */
const USED_CODE = 'That code has just been used. Wait for the next one — the app shows a new code every 30 seconds.'

const PUBLISHED_NOTE = 'Saved. The site rebuilds automatically — it is live in a minute or two.'

/* ---------------------------------------------------------- operations */

const ops = {}

/** Where the caller stands: signed out, half-way, or in. */
ops.session = {
  method: 'GET',
  auth: 'any',
  async run({ session }) {
    return { stage: session?.st || 'none', expiresAt: session ? session.exp * 1000 : null }
  },
}

ops.login = {
  method: 'POST',
  auth: 'any',
  async run({ req, res, body }) {
    if (!process.env.ADMIN_ID || !process.env.ADMIN_PASSWORD) {
      fail(500, 'Sign-in is not configured. ADMIN_ID and ADMIN_PASSWORD must be set in Vercel.')
    }
    if (await lockedOut(req)) {
      await penalty()
      await audit(req, 'sign-in', false, 'refused: too many failures')
      fail(429, 'Too many wrong attempts. Wait fifteen minutes and try again.')
    }
    if (!passwordMatches(body.id, body.password)) {
      await noteFailure(req)
      await audit(req, 'sign-in', false, 'wrong ID or password')
      await penalty()
      fail(401, 'Wrong ID or password.')
    }
    const state = await loadState({ fresh: true })
    if (state.totp) {
      await issueSession(req, res, 'mfa')
      await audit(req, 'sign-in', true, 'password accepted; waiting for the authenticator code')
      return { stage: 'mfa' }
    }
    await issueSession(req, res, 'enroll')
    await audit(req, 'sign-in', true, 'password accepted; no authenticator yet — setting one up')
    return { stage: 'enroll' }
  },
}

ops.verify = {
  method: 'POST',
  auth: 'mfa',
  async run({ req, res, body }) {
    if (await lockedOut(req)) {
      await penalty()
      fail(429, 'Too many wrong attempts. Wait fifteen minutes and try again.')
    }
    const from = {}
    const via = await verifySecondFactor(body.code, from)
    if (via === 'replay') fail(401, USED_CODE)
    if (!via) {
      await noteFailure(req)
      await audit(req, 'second factor', false, 'wrong code')
      await penalty()
      fail(401, 'That code is not right. Codes change every 30 seconds — use the current one.')
    }
    await issueSession(req, res, 'full', { via })
    let note = from.device ? `signed in with ${from.device}` : 'signed in'
    if (via === 'recovery') {
      const state = await loadState({ fresh: true })
      const left = (state.totp?.recovery || []).filter((r) => !r.used).length
      note = `signed in with a recovery code — ${left} left`
    }
    await audit(req, 'second factor', true, note)
    if (Math.random() < 0.2) await housekeeping()
    return { stage: 'full', via }
  },
}

ops['enroll-start'] = {
  method: 'POST',
  auth: 'enroll',
  async run({ req, res, session }) {
    const e = newEnrolment()
    // Same session id and start time: starting over cannot stretch the
    // fifteen minutes the password bought.
    await issueSession(req, res, 'enroll', { sid: session.sid, iat: session.iat, pe: e.sealed })
    return { secret: e.secretB32, uri: e.uri }
  },
}

ops['enroll-confirm'] = {
  method: 'POST',
  auth: 'enroll',
  async run({ req, res, body, session }) {
    if (!session.pe) fail(400, 'Start the set-up again.')
    if (await lockedOut(req)) {
      await penalty()
      fail(429, 'Too many wrong attempts. Wait fifteen minutes and try again.')
    }
    const codes = await completeEnrolment(session.pe, body.code)
    if (!codes) {
      await noteFailure(req)
      await penalty()
      fail(401, 'That code is not right. Check the app shows “Talikota Hari Krishna Admin” and use the current code.')
    }
    await issueSession(req, res, 'full', { via: 'enrolment' })
    await audit(req, 'authenticator', true, 'authenticator app set up')
    return { stage: 'full', recoveryCodes: codes }
  },
}

ops.logout = {
  method: 'POST',
  auth: 'any',
  async run({ req, res, session }) {
    clearSession(res)
    if (session) await audit(req, 'sign-out', true, '')
    return { stage: 'none' }
  },
}

/* --------------------------------------------------------------- reads */

ops.overview = {
  method: 'GET',
  auth: 'full',
  async run({ session }) {
    const [{ sha, files }, activity, state] = await Promise.all([
      readFiles([UPLOADS_PATH, MANIFEST_PATH, SITE_CONTENT_PATH]),
      readAudit(15),
      loadState(),
    ])
    const uploads = parseUploads(files[UPLOADS_PATH])
    const posters = parsePosters(files[MANIFEST_PATH])
    const site = parseSite(files[SITE_CONTENT_PATH])
    const today = new Date().toISOString().slice(0, 10)
    return {
      sha,
      counts: {
        posters: posters.posters.length,
        photos: uploads.photos.length,
        updates: uploads.updates.length,
        upcomingEvents: site.events.filter((e) => e.date >= today).length,
      },
      announcement: site.announcement,
      activity,
      health: {
        github: githubReady(),
        storage: Boolean(r2Config()),
        captions: Boolean(process.env.GEMINI_API_KEY),
        strongSessionKey: strongSecretConfigured(),
        recoveryCodesLeft: (state.totp?.recovery || []).filter((r) => !r.used).length,
      },
      session: { since: session.iat * 1000, via: session.via || null },
    }
  },
}

ops.content = {
  method: 'GET',
  auth: 'full',
  async run() {
    const { sha, files } = await readFiles([UPLOADS_PATH, MANIFEST_PATH, SITE_CONTENT_PATH])
    return {
      sha,
      uploads: parseUploads(files[UPLOADS_PATH]),
      posters: parsePosters(files[MANIFEST_PATH]).posters,
      site: parseSite(files[SITE_CONTENT_PATH]),
    }
  },
}

ops.activity = {
  method: 'GET',
  auth: 'full',
  async run() {
    return { entries: await readAudit(300) }
  },
}

ops.security = {
  method: 'GET',
  auth: 'full',
  async run({ req, session }) {
    const state = await loadState({ fresh: true })
    return {
      enrolledAt: state.totp?.createdAt || null,
      recoveryCodesLeft: (state.totp?.recovery || []).filter((r) => !r.used).length,
      devices: listDevices(state),
      maxDevices: MAX_DEVICES,
      adding: Boolean(session.pe),
      session: { since: session.iat * 1000, expires: session.exp * 1000, via: session.via || null, device: deviceLabel(req) },
      strongSessionKey: strongSecretConfigured(),
    }
  },
}

/* ------------------------------------------------------------- uploads */

ops.upload = {
  method: 'POST',
  auth: 'full',
  raw: true,
  async run({ req, session, raw }) {
    const id = String(req.query.id || '')
    const n = Number(req.query.n)
    checkUploadId(id)
    if (!Number.isInteger(n) || n < 0 || n >= MAX_PARTS) fail(400, 'Bad upload part.')
    if (!raw.length) fail(400, 'That part was empty.')
    await r2Put(`staging/${session.sid}/${id}/${n}`, raw, 'application/octet-stream')
    return { ok: true, n, bytes: raw.length }
  },
}

/* ---------------------------------------------------- photos & updates */

function entryFields(body, kind) {
  const title = String(body.title ?? '').trim()
  if (title.length < 3) fail(400, 'Give it a title of at least 3 characters.')
  if (title.length > 200) fail(400, 'Keep the title under 200 characters.')
  const category = body.category || (kind === 'photo' ? 'party' : undefined)
  if (category && !CATEGORIES.includes(category)) fail(400, 'Unknown category.')
  const text = String(body.description ?? '').trim().slice(0, 4000)
  return { title, category, text, sources: cleanSources(body.sources) }
}

function saveEntry(kind) {
  return {
    method: 'POST',
    auth: 'full',
    async run({ req, body, session }) {
      const f = entryFields(body, kind)
      const editing = body.id ? String(body.id) : null
      let buf = null
      let sig = null
      let orig = null
      let origSig = null
      if (kind === 'photo' && (body.image || !editing)) {
        if (!body.image) fail(400, 'Choose an image to upload.')
        buf = await readUpload(session, body.image)
        sig = detect(buf)
        if (!sig) fail(415, 'That file is not a JPEG, PNG or WebP image.')
        if (!imageSize(buf)) fail(400, 'That image could not be read.')
        // The untouched original, for the full-screen viewer and downloads.
        // The display copy above is what the gallery grid loads.
        if (body.original) {
          orig = await readUpload(session, body.original)
          origSig = detect(orig)
          if (!origSig || !imageSize(orig)) fail(415, 'The original photo could not be read.')
          if (orig.length > 30 * 1024 * 1024) fail(413, 'The original photo is over 30 MB.')
        }
      }

      const { commit, result } = await mutateFiles([UPLOADS_PATH], (files) => {
        const m = parseUploads(files[UPLOADS_PATH])
        const list = kind === 'photo' ? m.photos : m.updates
        const now = new Date().toISOString()
        const out = []
        let entry
        if (editing) {
          entry = list.find((e) => e.id === editing)
          if (!entry) fail(404, 'That entry no longer exists.')
          entry.title = f.title
          if (kind === 'photo') entry.description = f.text
          else entry.summary = f.text
          entry.category = f.category || entry.category
          entry.sources = f.sources
          entry.updatedAt = now
        } else {
          const id = `${now.slice(0, 10)}-${idSlug(f.title)}`
          if (list.some((e) => e.id === id)) fail(409, 'Something with that title was already published today.')
          entry = { id, title: f.title, category: f.category, sources: f.sources, publishedAt: now }
          if (kind === 'photo') entry.description = f.text
          else {
            entry.summary = f.text
            entry.date = now.slice(0, 10)
          }
          list.unshift(entry)
        }
        if (buf) {
          const size = imageSize(buf)
          // A replaced image gets a new file name, because /photos is served
          // immutable: the same name with new bytes would stay stale in every
          // browser that had seen it.
          const version = editing && entry.src ? `-${Date.now().toString(36)}` : ''
          const path = `${UPLOAD_DIR}/${entry.id}${version}.${sig.ext}`
          entry.src = `/photos/uploads/${entry.id}${version}.${sig.ext}`
          entry.bytes = buf.length
          if (size) {
            entry.width = size.w
            entry.height = size.h
          }
          out.push({ path, content: buf })
          if (orig) {
            const fullPath = `${UPLOAD_DIR}/${entry.id}${version}-full.${origSig.ext}`
            entry.original = `/photos/uploads/${entry.id}${version}-full.${origSig.ext}`
            entry.originalBytes = orig.length
            out.push({ path: fullPath, content: orig })
          } else {
            delete entry.original
            delete entry.originalBytes
          }
        }
        out.push({ path: UPLOADS_PATH, content: serializeUploads(m) })
        return {
          files: out,
          message: `${editing ? 'Edit' : 'Publish'} ${kind}: ${f.title}\n\nFrom the admin panel.`,
          result: entry.id,
        }
      })
      if (body.image) await dropUpload(session, body.image)
      if (body.original) await dropUpload(session, body.original)
      await audit(req, editing ? `edit ${kind}` : `publish ${kind}`, true, f.title)
      return { ok: true, id: result, commit, message: PUBLISHED_NOTE }
    },
  }
}

function deleteEntry(kind) {
  return {
    method: 'POST',
    auth: 'full',
    async run({ req, body }) {
      const id = String(body.id || '')
      if (!id) fail(400, 'Which entry?')
      const { commit, result } = await mutateFiles([UPLOADS_PATH], (files) => {
        const m = parseUploads(files[UPLOADS_PATH])
        const list = kind === 'photo' ? m.photos : m.updates
        const i = list.findIndex((e) => e.id === id)
        if (i === -1) fail(404, 'That entry no longer exists.')
        const [removed] = list.splice(i, 1)
        // The image file stays in the repository: unreferenced is removed from
        // the site, and nothing already shared turns into a broken image.
        return {
          files: [{ path: UPLOADS_PATH, content: serializeUploads(m) }],
          message: `Remove ${kind}: ${removed.title}\n\nFrom the admin panel.`,
          result: removed.title,
        }
      })
      await audit(req, `remove ${kind}`, true, result)
      return { ok: true, commit, message: PUBLISHED_NOTE }
    },
  }
}

ops['photo-save'] = saveEntry('photo')
ops['photo-delete'] = deleteEntry('photo')
ops['update-save'] = saveEntry('update')
ops['update-delete'] = deleteEntry('update')

/* ------------------------------------------------------------- posters */

const SLUG = /^[a-z0-9][a-z0-9-]{1,47}$/

function posterFields(body) {
  const titleEn = String(body.titleEn || '').trim()
  if (titleEn.length < 3) fail(400, 'An English title of at least 3 characters is required.')
  return {
    title: String(body.title || '').trim().slice(0, 200) || titleEn,
    titleEn: titleEn.slice(0, 200),
    summary: String(body.summary || '').trim().slice(0, 600),
    issue: String(body.issue || '').trim().slice(0, 24) || 'Campaign',
    date: String(body.date || '').trim().slice(0, 40),
  }
}

async function posterImages(session, body, required) {
  if (!body.artwork && !required) return null
  const artwork = await readUpload(session, body.artwork)
  const card = await readUpload(session, body.card)
  if (!artwork || !card) fail(400, 'Both the artwork and its preview card are required.')
  if (!isJpeg(artwork) || !isJpeg(card)) fail(415, 'The artwork and card must be JPEGs.')
  if (artwork.length > 10 * 1024 * 1024) fail(413, 'The artwork is too large.')
  if (card.length > 600 * 1024) fail(413, 'The preview card is too large.')
  const a = imageSize(artwork)
  const c = imageSize(card)
  if (!a || a.w !== 2048 || a.h !== 2560) fail(400, 'The artwork must be composed by the panel (2048x2560). Reload and try again.')
  if (!c || c.w !== 1200 || c.h !== 630) fail(400, 'The preview card must be 1200x630.')
  return { artwork, card, size: a }
}

ops['poster-publish'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body, session }) {
    const slug = String(body.slug || '').trim()
    if (!SLUG.test(slug)) fail(400, 'The web address must be lowercase letters, numbers and hyphens.')
    const f = posterFields(body)
    const geometry = sanitizeGeometry(body.geometry)
    const img = await posterImages(session, body, true)

    const { commit } = await mutateFiles([MANIFEST_PATH], (files) => {
      const m = parsePosters(files[MANIFEST_PATH])
      if (m.posters.some((p) => p.slug === slug)) fail(409, 'A poster already uses that web address.')
      m.posters.unshift({
        slug,
        ...f,
        version: 1,
        width: img.size.w,
        height: img.size.h,
        publishedAt: new Date().toISOString(),
        ...geometry,
      })
      return {
        files: [
          { path: `${POSTER_DIR}/${slug}-v1.jpg`, content: img.artwork },
          { path: `${POSTER_DIR}/${slug}-card-v1.jpg`, content: img.card },
          { path: MANIFEST_PATH, content: serializeManifest(m) },
        ],
        message: `Add poster: ${f.titleEn}\n\nFrom the admin panel.`,
      }
    })
    await dropUpload(session, body.artwork)
    await dropUpload(session, body.card)
    await audit(req, 'publish poster', true, `${f.titleEn} (/posters/${slug})`)
    return { ok: true, slug, url: `/posters/${slug}`, commit, message: PUBLISHED_NOTE }
  },
}

ops['poster-update'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body, session }) {
    const slug = String(body.slug || '').trim()
    if (!SLUG.test(slug)) fail(400, 'Which poster?')
    const f = posterFields(body)
    const geometry = body.geometry ? sanitizeGeometry(body.geometry) : null
    const img = await posterImages(session, body, false)

    const { commit } = await mutateFiles([MANIFEST_PATH], (files) => {
      const m = parsePosters(files[MANIFEST_PATH])
      const p = m.posters.find((x) => x.slug === slug)
      if (!p) fail(404, 'That poster no longer exists.')
      Object.assign(p, f, geometry || {}, { updatedAt: new Date().toISOString() })
      const out = []
      if (img) {
        // New artwork is a new version, and so a new file name: /posters is
        // served immutable, so replacing the bytes in place would leave the
        // old artwork cached for a year in every browser that had seen it.
        p.version = (Number(p.version) || 1) + 1
        out.push({ path: `${POSTER_DIR}/${slug}-v${p.version}.jpg`, content: img.artwork })
        out.push({ path: `${POSTER_DIR}/${slug}-card-v${p.version}.jpg`, content: img.card })
      }
      out.push({ path: MANIFEST_PATH, content: serializeManifest(m) })
      return { files: out, message: `Edit poster: ${f.titleEn}\n\nFrom the admin panel.` }
    })
    if (img) {
      await dropUpload(session, body.artwork)
      await dropUpload(session, body.card)
    }
    await audit(req, 'edit poster', true, `${f.titleEn}${img ? ' (new artwork)' : ''}`)
    return { ok: true, slug, commit, message: PUBLISHED_NOTE }
  },
}

ops['poster-delete'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body }) {
    const slug = String(body.slug || '').trim()
    if (!SLUG.test(slug)) fail(400, 'Which poster?')
    const { commit, result } = await mutateFiles([MANIFEST_PATH], (files) => {
      const m = parsePosters(files[MANIFEST_PATH])
      const p = m.posters.find((x) => x.slug === slug)
      if (!p) fail(404, 'No poster with that address.')
      m.posters = m.posters.filter((x) => x.slug !== slug)
      // Artwork files are left in place: posters already shared keep
      // rendering instead of turning into broken images in chat histories.
      return {
        files: [{ path: MANIFEST_PATH, content: serializeManifest(m) }],
        message: `Remove poster: ${p.titleEn || slug}\n\nFrom the admin panel.`,
        result: p.titleEn || slug,
      }
    })
    await audit(req, 'remove poster', true, result)
    return { ok: true, commit, message: PUBLISHED_NOTE }
  },
}

/* -------------------------------------------------------- site content */

ops['site-save'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body }) {
    const section = String(body.section || '')
    const value = sanitizeSection(section, body.value, { knownText: KNOWN_TEXT })
    const { commit } = await mutateFiles([SITE_CONTENT_PATH], (files) => {
      const site = parseSite(files[SITE_CONTENT_PATH])
      site[section] = value
      return {
        files: [{ path: SITE_CONTENT_PATH, content: serializeSiteContent(site) }],
        message: `Update site ${section}\n\nFrom the admin panel.`,
      }
    })
    const what = {
      announcement: 'announcement bar',
      events: 'events and programmes',
      contact: 'contact details',
      social: 'social accounts',
      text: 'page text',
    }[section]
    await audit(req, 'update site', true, what)
    return { ok: true, commit, value, message: PUBLISHED_NOTE }
  },
}

ops.summarize = {
  method: 'POST',
  auth: 'full',
  async run({ body }) {
    return { summary: await summarize(body.text, body.title) }
  },
}

/* ------------------------------------------------------------ security */

async function requireFreshCode(req, code) {
  const via = await verifySecondFactor(code, {})
  if (via === 'replay') fail(401, USED_CODE)
  if (via !== 'totp') {
    await noteFailure(req)
    await penalty()
    fail(401, 'Enter the current code from your authenticator app to do this.')
  }
}

ops['security-signout-all'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, res }) {
    await signOutEverywhere()
    clearSession(res)
    await audit(req, 'security', true, 'signed out every device')
    return { stage: 'none' }
  },
}

ops['security-recovery'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body }) {
    await requireFreshCode(req, body.code)
    const codes = await regenerateRecoveryCodes()
    await audit(req, 'security', true, 'new recovery codes made; the old ones stopped working')
    return { recoveryCodes: codes }
  },
}

/*
 * Adding a phone takes two codes: one from a phone ALREADY on the account
 * (so an open session alone cannot add an attacker's phone), then the first
 * code from the new phone (so a mistyped scan is not saved). Between the two,
 * the new secret rides sealed in the session cookie, as at first set-up.
 */
ops['device-add-start'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, res, body, session }) {
    const name = cleanDeviceName(body.name)
    if (!name) fail(400, 'Give the new phone a name, like “Dad’s phone”.')
    if ((await deviceCount()) >= MAX_DEVICES) fail(409, `The account already has ${MAX_DEVICES} phones. Remove one first.`)
    await requireFreshCode(req, body.code)
    const e = newDeviceEnrolment(name)
    await issueSession(req, res, 'full', { sid: session.sid, iat: session.iat, via: session.via, pe: e.sealed, pn: name })
    return { secret: e.secretB32, uri: e.uri, name }
  },
}

ops['device-add-confirm'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, res, body, session }) {
    if (!session.pe) fail(400, 'Start adding the phone again.')
    if (await lockedOut(req)) {
      await penalty()
      fail(429, 'Too many wrong attempts. Wait fifteen minutes and try again.')
    }
    const ok = await addDevice(session.pe, body.code, session.pn)
    if (!ok) {
      await noteFailure(req)
      await penalty()
      fail(401, 'That code is not right. Use the code the NEW phone shows for “Talikota Hari Krishna Admin”.')
    }
    await issueSession(req, res, 'full', { sid: session.sid, iat: session.iat, via: session.via })
    await audit(req, 'authenticator', true, `phone added: ${session.pn}`)
    return { ok: true }
  },
}

ops['device-add-cancel'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, res, session }) {
    await issueSession(req, res, 'full', { sid: session.sid, iat: session.iat, via: session.via })
    return { ok: true }
  },
}

ops['device-remove'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body }) {
    await requireFreshCode(req, body.code)
    const name = await removeDevice(String(body.id || ''))
    await audit(req, 'authenticator', true, `phone removed: ${name}`)
    return { ok: true }
  },
}

ops['device-rename'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, body }) {
    const name = await renameDevice(String(body.id || ''), body.name)
    await audit(req, 'authenticator', true, `phone renamed: ${name}`)
    return { ok: true, name }
  },
}

ops['security-reset'] = {
  method: 'POST',
  auth: 'full',
  async run({ req, res, body }) {
    await requireFreshCode(req, body.code)
    await resetSecondFactor()
    clearSession(res)
    await audit(req, 'security', true, 'every authenticator removed; a new one will be set up at next sign-in')
    return { stage: 'none' }
  },
}

/* ------------------------------------------------------------- handler */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')

  // Not found, rather than forbidden, anywhere but the admin host: nothing
  // here should confirm to a stranger that there is anything to find.
  if (!hostOk(req)) return res.status(404).json({ error: 'Not found' })

  const name = String(req.query.op || '')
  const op = Object.prototype.hasOwnProperty.call(ops, name) ? ops[name] : null
  if (!op) return res.status(404).json({ error: 'Not found' })
  if (req.method !== op.method) {
    res.setHeader('Allow', op.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (op.method === 'POST' && !originOk(req)) {
    return res.status(403).json({ error: 'Refused.' })
  }

  try {
    if (!r2Config()) fail(503, 'The security store is not configured, so the panel is locked.')

    let session
    try {
      session = await readSession(req, res)
    } catch (err) {
      console.error('session store unavailable:', err?.message)
      fail(503, 'The panel cannot check sign-ins right now, so it is locked. Try again shortly.')
    }

    if (op.auth !== 'any' && session?.st !== op.auth) {
      fail(401, op.auth === 'full' ? 'Please sign in again.' : 'Start signing in again.')
    }

    let body = {}
    let raw = null
    if (op.raw) raw = await readRaw(req, MAX_PART)
    else body = await readJson(req)

    const out = await op.run({ req, res, body, raw, session })
    return res.status(200).json(out ?? { ok: true })
  } catch (err) {
    if (err instanceof HttpError || (err?.status && err.status < 500)) {
      return res.status(err.status).json({ error: err.message })
    }
    if (err?.status === 503) return res.status(503).json({ error: err.message })
    console.error(`admin op ${name} failed:`, err)
    return res.status(500).json({ error: 'That did not work, and nothing was changed. Try again in a moment.' })
  }
}
