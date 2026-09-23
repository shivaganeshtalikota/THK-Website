/**
 * Everything that decides who may use the admin panel.
 *
 * THE MODEL
 *   1. A password (ADMIN_ID + ADMIN_PASSWORD, in Vercel only) proves
 *      knowledge. On its own it earns nothing but a five-minute ticket to the
 *      next step.
 *   2. A six-digit code from an authenticator app proves possession of the
 *      phone it was enrolled on. Only both together open a session.
 *   3. The session is a signed, HttpOnly, host-only cookie on
 *      admin.talikotaharikrishna.com, idle-expiring after an hour and
 *      absolutely after twelve. JavaScript on the page cannot read it, no other
 *      subdomain is ever sent it, and SameSite=Strict keeps other sites from
 *      riding it.
 *
 * WHERE THE STATE LIVES
 * One small object in R2 (sec/state.json): the encrypted authenticator secret,
 * hashed one-time recovery codes, the last accepted code (so a code cannot be
 * replayed within its thirty seconds) and a session epoch — bumping it signs
 * every device out at once. The authenticator secret is sealed with AES-256-GCM
 * under a key the bucket never sees, so read access to R2 alone does not yield
 * a second factor.
 *
 * KEYS
 * Derived with scrypt from ADMIN_SESSION_SECRET when that is set (recommended:
 * 32+ random characters), otherwise from the admin password itself. The
 * password-derived key has one property worth keeping on purpose: changing the
 * password invalidates every session. Setting ADMIN_SESSION_SECRET later is
 * handled — the old key is still tried when unsealing, and the secret is
 * re-sealed under the new one on the next sign-in.
 *
 * FAILING CLOSED
 * If the security store cannot be read, nobody signs in. A panel that can
 * commit to a politician's live site does not get to shrug off its own second
 * factor because a bucket was briefly unreachable.
 *
 * Nothing in this file logs a password, a code, a secret or a token.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { r2Config, r2Delete, r2Get, r2List, r2Put } from './r2.js'

export const ADMIN_HOST = 'admin.talikotaharikrishna.com'
export const ADMIN_ORIGIN = `https://${ADMIN_HOST}`
export const COOKIE = '__Host-thk_admin'

/** Local testing only. Never set on Vercel. */
const DEV = process.env.ADMIN_DEV === '1'
const DEV_HOST = /^admin\.localhost(:\d+)?$/

const STATE_KEY = 'sec/state.json'

/* ------------------------------------------------------------ encoding */

export const b64u = (buf) => Buffer.from(buf).toString('base64url')
const fromB64u = (s) => Buffer.from(String(s), 'base64url')
const sha256 = (s) => createHash('sha256').update(s).digest()

/** Constant-time string comparison, whatever the lengths. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  return timingSafeEqual(sha256(a), sha256(b))
}

/* ---------------------------------------------------------------- keys */

let keyCache = null

/**
 * The root keys, primary first, then any older one still worth trying.
 * scrypt is deliberately slow; this runs once per cold start.
 */
function rootKeys() {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  const pw = `${process.env.ADMIN_ID || ''}\u0000${process.env.ADMIN_PASSWORD || ''}`
  const fingerprint = sha256(`${secret}\u0001${pw}`).toString('hex')
  if (keyCache?.fingerprint === fingerprint) return keyCache

  const stretch = (m) => scryptSync(m, 'thk-admin-root-v1', 32, { N: 16384, r: 8, p: 1 })
  const fromPw = stretch(`p:${pw}`)
  const useSecret = secret.length >= 32
  const primary = useSecret ? stretch(`s:${secret}`) : fromPw
  keyCache = {
    fingerprint,
    primary,
    primaryId: useSecret ? 's' : 'p',
    candidates: useSecret ? [['s', primary], ['p', fromPw]] : [['p', fromPw]],
  }
  return keyCache
}

const subkey = (root, purpose) => Buffer.from(hkdfSync('sha256', root, Buffer.alloc(0), `thk-admin:${purpose}`, 32))

export function strongSecretConfigured() {
  return (process.env.ADMIN_SESSION_SECRET || '').length >= 32
}

/* ---------------------------------------------------------- sealing */

function seal(root, plaintext) {
  const key = subkey(root, 'seal')
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([c.update(plaintext), c.final()])
  return b64u(Buffer.concat([iv, c.getAuthTag(), ct]))
}

function unsealWith(root, sealed) {
  const raw = fromB64u(sealed)
  const key = subkey(root, 'seal')
  const d = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12))
  d.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([d.update(raw.subarray(28)), d.final()])
}

/** Try every candidate key. Returns {plain, keyId} or null. */
function unseal(sealed) {
  for (const [id, root] of rootKeys().candidates) {
    try {
      return { plain: unsealWith(root, sealed), keyId: id }
    } catch {
      // wrong key or tampered ciphertext — try the next
    }
  }
  return null
}

/* ------------------------------------------------------ request checks */

/** The real host this request was routed on. */
function requestHost(req) {
  return String(req.headers.host || '').toLowerCase()
}

/**
 * The admin API answers on the admin subdomain and nowhere else.
 * X-Forwarded-Host, when present, has to agree — a request cannot be made to
 * look like the admin host by adding a header.
 */
export function hostOk(req) {
  const host = requestHost(req)
  const fwd = req.headers['x-forwarded-host'] ? String(req.headers['x-forwarded-host']).toLowerCase() : host
  if (host !== fwd) return false
  if (host === ADMIN_HOST) return true
  return DEV && DEV_HOST.test(host)
}

/**
 * CSRF, belt and braces. SameSite=Strict already keeps the cookie off
 * cross-site requests; on top of that every state-changing call must come
 * from the panel's own origin AND carry a custom header, which a cross-site
 * form cannot send and a cross-site fetch cannot send without a preflight this
 * API never approves.
 */
export function originOk(req) {
  if (req.headers['x-thk-admin'] !== '1') return false
  const origin = String(req.headers.origin || '')
  if (origin === ADMIN_ORIGIN) return true
  return DEV && /^http:\/\/admin\.localhost(:\d+)?$/.test(origin)
}

export function clientIp(req) {
  return (
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

/** A salted, truncated hash — enough to count repeats and spot a pattern in
 *  the activity log, without keeping anybody's address. */
export function ipTag(req) {
  return createHmac('sha256', subkey(rootKeys().primary, 'ip'))
    .update(clientIp(req))
    .digest('hex')
    .slice(0, 12)
}

/**
 * Which password a session was issued under. Checked on every request, so
 * changing ADMIN_PASSWORD (or ADMIN_ID) in Vercel signs every session out —
 * even when ADMIN_SESSION_SECRET means the signing key itself did not change.
 */
const passwordTag = () =>
  createHmac('sha256', subkey(rootKeys().primary, 'pw'))
    .update(`${process.env.ADMIN_ID || ''}\u0000${process.env.ADMIN_PASSWORD || ''}`)
    .digest('hex')
    .slice(0, 16)

const uaTag = (req) => createHash('sha256').update(String(req.headers['user-agent'] || '')).digest('hex').slice(0, 16)

/** "Chrome on Android" — for the activity log, nothing more precise. */
export function deviceLabel(req) {
  const ua = String(req.headers['user-agent'] || '')
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Browser'
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'unknown device'
  return `${browser} on ${os}`
}

/* ------------------------------------------------------------ state */

let stateCache = null // { at, value }

/** Throws when the store cannot be read — callers fail closed. */
export async function loadState({ fresh = false } = {}) {
  if (!r2Config()) throw new Error('Security store (R2) is not configured')
  if (!fresh && stateCache && Date.now() - stateCache.at < 15_000) return stateCache.value
  const buf = await r2Get(STATE_KEY)
  const value = buf ? JSON.parse(buf.toString('utf8')) : { epoch: 1, totp: null }
  value.epoch ??= 1
  stateCache = { at: Date.now(), value }
  return value
}

export async function saveState(value) {
  await r2Put(STATE_KEY, Buffer.from(JSON.stringify(value)), 'application/json')
  stateCache = { at: Date.now(), value }
}

/* ------------------------------------------------------------- TOTP */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32(buf) {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

export function fromBase32(s) {
  const clean = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const out = []
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** RFC 4226 HOTP, 6 digits (RFC 6238 TOTP is this with counter = time/30). */
export function hotp(secret, counter, digits = 6) {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', secret).update(msg).digest()
  const o = h[h.length - 1] & 0x0f
  const bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(bin % 10 ** digits).padStart(digits, '0')
}

/**
 * Check a code against the current step and one either side (clocks drift),
 * refusing any step at or before the last one accepted — so a code seen over
 * somebody's shoulder is useless once it has been used.
 * Returns the matched step, 'replay' for a correct code that was already
 * used, or null.
 */
export function matchTotp(secret, code, lastStep = 0, now = Date.now()) {
  if (!/^\d{6}$/.test(String(code))) return null
  const step = Math.floor(now / 30_000)
  let hit = null
  let replay = false
  for (const s of [step - 1, step, step + 1]) {
    // Every candidate is compared, match or not, so timing says nothing.
    const ok = safeEqual(hotp(secret, s), String(code))
    if (ok && s > lastStep && hit === null) hit = s
    else if (ok && s <= lastStep) replay = true
  }
  return hit !== null ? hit : replay ? 'replay' : null
}

export function otpauthUri(secretB32) {
  const label = encodeURIComponent('Talikota Hari Krishna Admin:office')
  const issuer = encodeURIComponent('Talikota Hari Krishna Admin')
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}

/* ---------------------------------------------------- recovery codes */

const RC_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o, 1/l/i

export function makeRecoveryCodes(n = 10) {
  const codes = []
  for (let i = 0; i < n; i += 1) {
    const bytes = randomBytes(10)
    let s = ''
    for (const b of bytes) s += RC_ALPHABET[b % RC_ALPHABET.length]
    codes.push(`${s.slice(0, 5)}-${s.slice(5)}`)
  }
  return codes
}

/**
 * Salted, and deliberately NOT keyed by the session key: that key changes when
 * ADMIN_SESSION_SECRET is set or the password changes, and recovery codes
 * must keep working through both — they are the way back in.
 */
const hashRecovery = (code, salt) =>
  createHash('sha256')
    .update(`${salt}:${String(code).toLowerCase().replace(/[^a-z0-9]/g, '')}`)
    .digest('hex')

/* ---------------------------------------------------- second factor */

/** Unseal the enrolled secret, re-sealing it under the primary key if an
 *  older one was needed. Returns the secret Buffer, or throws. */
async function enrolledSecret(state) {
  const got = unseal(state.totp.enc)
  if (!got) throw new Error('The authenticator secret could not be unsealed')
  if (got.keyId !== rootKeys().primaryId) {
    state.totp.enc = seal(rootKeys().primary, got.plain)
    state.totp.keyId = rootKeys().primaryId
    await saveState(state).catch(() => {})
  }
  return got.plain
}

/**
 * Verify a second-factor code: an authenticator code, or one of the
 * recovery codes (each works once). Records the use.
 * Returns 'totp' | 'recovery' | 'replay' (right code, already used) | null.
 */
export async function verifySecondFactor(code) {
  const state = await loadState({ fresh: true })
  if (!state.totp) return null
  const given = String(code || '').trim()

  if (/^\d{6}$/.test(given.replace(/\s/g, ''))) {
    const secret = await enrolledSecret(state)
    const step = matchTotp(secret, given.replace(/\s/g, ''), state.totp.lastStep || 0)
    if (step === null) return null
    if (step === 'replay') return 'replay'
    state.totp.lastStep = step
    await saveState(state)
    return 'totp'
  }

  const h = hashRecovery(given, state.totp.salt || '')
  const idx = (state.totp.recovery || []).findIndex((r) => !r.used && safeEqual(r.h, h))
  if (idx === -1) return null
  state.totp.recovery[idx].used = new Date().toISOString()
  await saveState(state)
  return 'recovery'
}

/** Start enrolment: a fresh secret, sealed so it can ride in the cookie. */
export function newEnrolment() {
  const secret = randomBytes(20)
  return {
    secretB32: base32(secret),
    uri: otpauthUri(base32(secret)),
    sealed: seal(rootKeys().primary, secret),
  }
}

/** Finish enrolment if the code matches. Returns recovery codes, or null. */
export async function completeEnrolment(sealed, code) {
  const got = unseal(sealed)
  if (!got) return null
  const step = matchTotp(got.plain, String(code || '').replace(/\s/g, ''), 0)
  if (step === null || step === 'replay') return null

  const state = await loadState({ fresh: true })
  if (state.totp) {
    // Somebody finished enrolling in the meantime. Do not overwrite it.
    const err = new Error('An authenticator is already set up.')
    err.status = 409
    throw err
  }
  const codes = makeRecoveryCodes()
  const salt = randomBytes(16).toString('hex')
  state.totp = {
    enc: seal(rootKeys().primary, got.plain),
    keyId: rootKeys().primaryId,
    createdAt: new Date().toISOString(),
    lastStep: step,
    salt,
    recovery: codes.map((c) => ({ h: hashRecovery(c, salt), used: null })),
  }
  await saveState(state)
  return codes
}

export async function regenerateRecoveryCodes() {
  const state = await loadState({ fresh: true })
  if (!state.totp) return null
  const codes = makeRecoveryCodes()
  state.totp.salt = randomBytes(16).toString('hex')
  state.totp.recovery = codes.map((c) => ({ h: hashRecovery(c, state.totp.salt), used: null }))
  await saveState(state)
  return codes
}

/** Remove the authenticator and sign everyone out. The next sign-in enrols. */
export async function resetSecondFactor() {
  const state = await loadState({ fresh: true })
  state.totp = null
  state.epoch = (state.epoch || 1) + 1
  await saveState(state)
}

export async function signOutEverywhere() {
  const state = await loadState({ fresh: true })
  state.epoch = (state.epoch || 1) + 1
  await saveState(state)
}

/* ---------------------------------------------------------- sessions */

const LIFETIME = {
  mfa: 5 * 60, // password accepted, code not yet given
  enroll: 15 * 60, // password accepted, no authenticator exists yet
  full: 12 * 60 * 60, // absolute ceiling
}
const IDLE = 60 * 60 // a full session lapses after an hour untouched

function signToken(payload) {
  const body = b64u(JSON.stringify(payload))
  const mac = createHmac('sha256', subkey(rootKeys().primary, 'session')).update(body).digest()
  return `${body}.${b64u(mac)}`
}

function readToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = createHmac('sha256', subkey(rootKeys().primary, 'session')).update(body).digest()
  const given = fromB64u(mac)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    return JSON.parse(fromB64u(body).toString('utf8'))
  } catch {
    return null
  }
}

function cookieFrom(req) {
  const raw = String(req.headers.cookie || '')
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > -1 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim()
  }
  return null
}

function writeCookie(res, value, maxAge) {
  const attrs = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', `Max-Age=${maxAge}`]
  res.setHeader('Set-Cookie', attrs.join('; '))
}

export function clearSession(res) {
  writeCookie(res, '', 0)
}

/**
 * Issue a session cookie at a given stage. `extra` rides along signed (the
 * sealed enrolment secret, for instance) — it is authenticated, and anything
 * secret in it is separately encrypted.
 */
export async function issueSession(req, res, stage, extra = {}) {
  const now = Math.floor(Date.now() / 1000)
  const state = await loadState()
  const payload = {
    v: 1,
    sid: extra.sid || b64u(randomBytes(12)),
    st: stage,
    iat: extra.iat || now,
    seen: now,
    exp: (extra.iat || now) + LIFETIME[stage],
    ep: state.epoch,
    ua: uaTag(req),
    pw: passwordTag(),
    ...(extra.pe ? { pe: extra.pe } : {}),
    ...(extra.via ? { via: extra.via } : {}),
  }
  const maxAge = stage === 'full' ? Math.min(IDLE, payload.exp - now) : payload.exp - now
  writeCookie(res, signToken(payload), Math.max(1, maxAge))
  return payload
}

/**
 * The caller's session, verified, or null.
 *
 * Checks, in order: signature, absolute expiry, idle expiry (full sessions),
 * that the browser is the one it was issued to, and that nobody has pressed
 * "sign out everywhere" since. A full session is quietly refreshed so an
 * hour's idle limit does not end a morning of active work.
 */
export async function readSession(req, res) {
  const p = readToken(cookieFrom(req))
  if (!p || p.v !== 1 || !LIFETIME[p.st]) return null
  const now = Math.floor(Date.now() / 1000)
  if (now >= p.exp) return null
  if (p.st === 'full' && now - p.seen > IDLE) return null
  if (p.ua !== uaTag(req)) return null
  if (p.pw !== passwordTag()) return null

  const state = await loadState()
  if (p.ep !== state.epoch) return null

  if (res && p.st === 'full' && now - p.seen > 60) {
    await issueSession(req, res, 'full', { sid: p.sid, iat: p.iat, via: p.via })
  }
  return p
}

/* ----------------------------------------------------------- lockout */

const WINDOW_MS = 15 * 60 * 1000
const PER_ADDRESS = 8 // failures per address per window
const OVERALL = 40 // failures from everyone per window — a distributed attack

const memoryFailures = new Map()

/** Is sign-in refused right now for this caller? Fails closed on store errors. */
export async function lockedOut(req) {
  const win = Math.floor(Date.now() / WINDOW_MS)
  const tag = ipTag(req)
  const mem = memoryFailures.get(`${win}:${tag}`) || 0
  if (mem >= PER_ADDRESS) return true
  const [mine, all] = await Promise.all([
    r2List(`sec/fail/${win}/${tag}/`, PER_ADDRESS + 1),
    r2List(`sec/fail/${win}/`, OVERALL + 1),
  ])
  return mine.length >= PER_ADDRESS || all.length >= OVERALL
}

export async function noteFailure(req) {
  const win = Math.floor(Date.now() / WINDOW_MS)
  const tag = ipTag(req)
  memoryFailures.set(`${win}:${tag}`, (memoryFailures.get(`${win}:${tag}`) || 0) + 1)
  await r2Put(`sec/fail/${win}/${tag}/${Date.now().toString(36)}${randomBytes(3).toString('hex')}`, Buffer.from('1'), 'text/plain').catch(
    () => {},
  )
}

/** A fixed pause on every rejected attempt: volume is what guessing needs. */
export const penalty = () => new Promise((r) => setTimeout(r, 1000))

/** Check the password pair. Both halves must match. */
export function passwordMatches(id, password) {
  const { ADMIN_ID, ADMIN_PASSWORD } = process.env
  if (!ADMIN_PASSWORD || !ADMIN_ID) return false
  // Both compared every time, so the timing does not say which half was wrong.
  const a = safeEqual(String(id ?? ''), ADMIN_ID)
  const b = safeEqual(String(password ?? ''), ADMIN_PASSWORD)
  return a && b
}

/* ------------------------------------------------------------- audit */

/**
 * Append to the activity log.
 *
 * The entry is carried IN the object key, base64url-encoded, under an
 * inverted timestamp — so one list call returns the newest entries first with
 * everything needed to show them, rather than a list call plus one read per
 * line. Keys are capped well under R2's 1024-byte limit.
 */
export async function audit(req, op, ok, detail = '') {
  try {
    const t = Date.now()
    const inv = String(1e13 - t).padStart(13, '0')
    const entry = { t, op, ok: ok ? 1 : 0, ip: ipTag(req).slice(0, 8), dev: deviceLabel(req), d: String(detail).slice(0, 200) }
    let enc = b64u(JSON.stringify(entry))
    if (enc.length > 900) enc = b64u(JSON.stringify({ ...entry, d: entry.d.slice(0, 60) }))
    await r2Put(`audit/${inv}-${randomBytes(3).toString('hex')}.${enc}`, Buffer.from('1'), 'text/plain')
  } catch (err) {
    console.error('audit write failed:', err?.message)
  }
}

export async function readAudit(limit = 100) {
  const keys = await r2List('audit/', Math.min(1000, limit))
  const out = []
  for (const k of keys) {
    const enc = k.slice(k.indexOf('.') + 1)
    try {
      out.push(JSON.parse(fromB64u(enc).toString('utf8')))
    } catch {
      // a malformed key is skipped, not fatal
    }
  }
  return out
}

/* -------------------------------------------------------- housekeeping */

/**
 * Delete stale lockout markers and abandoned upload parts. Cheap, bounded,
 * and run opportunistically after a successful sign-in rather than on a
 * schedule nobody would remember to keep alive.
 */
export async function housekeeping() {
  const win = Math.floor(Date.now() / WINDOW_MS)
  try {
    const fails = await r2List('sec/fail/', 500)
    await Promise.all(
      fails
        .filter((k) => Number(k.split('/')[2]) < win - 1)
        .slice(0, 200)
        .map((k) => r2Delete(k).catch(() => {})),
    )
    const staged = await r2List('staging/', 500)
    const dayAgo = Date.now() - 24 * 3600 * 1000
    await Promise.all(
      staged
        .filter((k) => {
          const ts = parseInt(k.split('/')[2]?.split('-')[0] || '', 36)
          return Number.isFinite(ts) && ts < dayAgo
        })
        .slice(0, 200)
        .map((k) => r2Delete(k).catch(() => {})),
    )
  } catch {
    // housekeeping never matters more than the request that triggered it
  }
}
