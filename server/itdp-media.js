/**
 * The iTDP Telangana media bucket(s), as the admin panel writes them.
 *
 * Programme photographs for itdptelangana.com live in object storage, not in
 * that site's repository: Cloudflare R2 first (10 GB free), then an
 * S3-compatible fallback when R2 is full or refuses. The public site reads
 * them back through its own /media/<key> function, primary then fallback, so
 * neither side needs to record which bucket took a photo.
 *
 * The same client as itdp-telangana/server/storage.js — keep the two in step.
 *
 * Environment (this project, Vercel > Settings > Environment Variables):
 *   ITDP_R2_BUCKET               the iTDP bucket, e.g. itdp-media (required)
 *   ITDP_R2_ACCOUNT_ID, ITDP_R2_ACCESS_KEY_ID, ITDP_R2_SECRET_ACCESS_KEY
 *                                optional; default to this site's R2_* values,
 *                                so one Cloudflare token can cover both buckets
 *   MEDIA_FALLBACK_ENDPOINT, MEDIA_FALLBACK_REGION, MEDIA_FALLBACK_ACCESS_KEY_ID,
 *   MEDIA_FALLBACK_SECRET_ACCESS_KEY, MEDIA_FALLBACK_BUCKET
 *                                the fallback, identical to the iTDP project's
 *   ITDP_MEDIA_BUDGET_GB         optional, default 9.5: write to the fallback
 *                                once the primary holds this much
 *
 * ITDP_MEDIA_LOCAL_DIR (testing only) swaps the buckets for a folder.
 */
import { createHash, createHmac } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'

const LOCAL = process.env.ITDP_MEDIA_LOCAL_DIR ? resolve(process.env.ITDP_MEDIA_LOCAL_DIR) : null

/** Object keys the site ever uses: lowercase path segments and a file name. */
export const SAFE_KEY = /^(?!.*\.\.)[a-z0-9][a-z0-9/_.-]{0,200}$/

/**
 * A store's settings from `${prefix}_*`, each falling back to
 * `${fallbackPrefix}_*` when unset (ITDP_R2_ACCESS_KEY_ID -> R2_ACCESS_KEY_ID).
 */
function fromEnv(prefix, fallbackPrefix) {
  const get = (name) => process.env[`${prefix}_${name}`] || (fallbackPrefix ? process.env[`${fallbackPrefix}_${name}`] : undefined)
  const accessKeyId = get('ACCESS_KEY_ID')
  const secretAccessKey = get('SECRET_ACCESS_KEY')
  const bucket = get('BUCKET')
  let endpoint = get('ENDPOINT')
  if (!endpoint && get('ACCOUNT_ID')) endpoint = `https://${get('ACCOUNT_ID')}.r2.cloudflarestorage.com`
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null
  const url = new URL(endpoint)
  return {
    name: prefix,
    host: url.host,
    protocol: url.protocol,
    region: get('REGION') || 'auto',
    accessKeyId,
    secretAccessKey,
    bucket,
  }
}

/** The stores that are configured, primary first. */
export function stores() {
  if (LOCAL) return [{ name: 'local', local: true }]
  // The bucket name is never borrowed from this site: it has to be set.
  const primary = process.env.ITDP_R2_BUCKET ? fromEnv('ITDP_R2', 'R2') : null
  return [primary, fromEnv('MEDIA_FALLBACK')].filter(Boolean)
}

export const storageReady = () => stores().length > 0

/* ------------------------------------------------------------------ SigV4 */

const sha256hex = (data) => createHash('sha256').update(data).digest('hex')
const hmac = (key, data) => createHmac('sha256', key).update(data).digest()

/** Percent-encode a path segment the way SigV4 requires (!'()* included). */
const encodeSegment = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
const encodeKey = (key) => key.split('/').map(encodeSegment).join('/')

async function signedFetch(cfg, { method, key, body, contentType, query }) {
  const payload = body ?? Buffer.alloc(0)
  const payloadHash = sha256hex(payload)
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  // Path-style addressing: works on R2, B2 and every S3-compatible service.
  const canonicalUri = `/${cfg.bucket}${key ? `/${encodeKey(key)}` : ''}`
  const canonicalQuery = Object.keys(query || {})
    .sort()
    .map((k) => `${encodeSegment(k)}=${encodeSegment(query[k])}`)
    .join('&')

  const headers = { host: cfg.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate }
  if (contentType) headers['content-type'] = contentType
  const names = Object.keys(headers).sort()
  const canonicalHeaders = names.map((n) => `${n}:${String(headers[n]).trim()}\n`).join('')
  const signedHeaders = names.join(';')

  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n')
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), cfg.region), 's3'), 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  return fetch(`${cfg.protocol}//${cfg.host}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ''}`, {
    method,
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: method === 'GET' || method === 'HEAD' ? undefined : payload,
  })
}

/* ---------------------------------------------------------- local folder */

function localPath(key) {
  const p = resolve(LOCAL, ...String(key).split('/'))
  if (p !== LOCAL && !p.startsWith(LOCAL + sep)) throw new Error('storage: key escapes the folder')
  return p
}

async function walk(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

/* -------------------------------------------------------- one store, raw */

export async function getFrom(cfg, key) {
  if (cfg.local) return fs.readFile(localPath(key)).catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)))
  const res = await signedFetch(cfg, { method: 'GET', key })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`${cfg.name} GET ${key}: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function putTo(cfg, key, body, contentType) {
  if (cfg.local) {
    const p = localPath(key)
    await fs.mkdir(dirname(p), { recursive: true })
    await fs.writeFile(p, body)
    return true
  }
  const res = await signedFetch(cfg, { method: 'PUT', key, body, contentType })
  if (!res.ok) throw new Error(`${cfg.name} PUT ${key}: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return true
}

export async function existsIn(cfg, key) {
  if (cfg.local) return fs.access(localPath(key)).then(() => true, () => false)
  const res = await signedFetch(cfg, { method: 'HEAD', key })
  return res.ok
}

export async function deleteFrom(cfg, key) {
  if (cfg.local) {
    await fs.rm(localPath(key), { force: true })
    return true
  }
  const res = await signedFetch(cfg, { method: 'DELETE', key })
  if (!res.ok && res.status !== 404) throw new Error(`${cfg.name} DELETE ${key}: ${res.status}`)
  return true
}

export async function listIn(cfg, prefix, max = 100) {
  if (cfg.local) {
    const keys = (await walk(LOCAL)).map((p) => p.slice(LOCAL.length + 1).split(sep).join('/')).filter((k) => k.startsWith(prefix))
    return keys.sort().slice(0, max)
  }
  const res = await signedFetch(cfg, { method: 'GET', key: '', query: { 'list-type': '2', prefix, 'max-keys': String(max) } })
  if (!res.ok) return []
  return [...(await res.text()).matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1])
}

/* ------------------------------------------------- primary, then fallback */

/**
 * Read a key: the primary first, then the fallback.
 * A store that errors is skipped rather than failing the read, so an outage
 * of one provider only loses the photographs that live solely there.
 */
export async function mediaGet(key) {
  let lastErr = null
  for (const cfg of stores()) {
    try {
      const buf = await getFrom(cfg, key)
      if (buf) return buf
    } catch (err) {
      lastErr = err
      console.error(err.message)
    }
  }
  if (lastErr && stores().length === 1) throw lastErr
  return null
}

/**
 * Write a key to the primary, or to the fallback if the primary is full or
 * refuses. Returns the name of the store that took it.
 *
 * @param {{preferFallback?: boolean}} opts  set when the caller already knows
 *        the primary is at its size budget.
 */
export async function mediaPut(key, body, contentType, { preferFallback = false } = {}) {
  const list = stores()
  if (!list.length) throw new Error('No media storage is configured.')
  const order = preferFallback && list.length > 1 ? [list[1], list[0]] : list
  let lastErr = null
  for (const cfg of order) {
    try {
      await putTo(cfg, key, body, contentType)
      return cfg.name
    } catch (err) {
      lastErr = err
      console.error(err.message)
    }
  }
  throw lastErr
}


/** Bytes above which new uploads go to the fallback bucket. */
export const PRIMARY_BUDGET = Number(process.env.ITDP_MEDIA_BUDGET_GB || 9.5) * 1024 ** 3
