/**
 * Minimal S3-compatible client for Cloudflare R2, signed by hand.
 *
 * WHY NOT THE AWS SDK
 * @aws-sdk/client-s3 pulls several megabytes into a serverless bundle to do
 * what amounts to one PUT and one GET. SigV4 is a well-specified hashing
 * exercise and Node already has the crypto for it, so the whole client is
 * below and the project keeps its dependency list short — which for a site
 * whose other two functions have zero dependencies is worth keeping.
 *
 * WHY THE BUCKET IS PRIVATE
 * Cards are read back through this site rather than from a public bucket URL.
 * R2's public r2.dev domain is documented as rate-limited and not for
 * production, and a custom R2 domain would mean moving this domain's DNS to
 * Cloudflare — it is on Vercel's nameservers, and moving a live political
 * site's DNS to serve preview images is not a trade worth making. Reading
 * through a function instead costs nothing extra: R2 charges no egress, the
 * images end up same-origin with the page that references them, and the CDN
 * caches them so the function is not invoked again.
 *
 * Environment (Vercel > Settings > Environment Variables — never in the repo,
 * which is public):
 *   R2_ACCOUNT_ID          Cloudflare account id
 *   R2_ACCESS_KEY_ID       S3 access key for the bucket
 *   R2_SECRET_ACCESS_KEY   its secret
 *   R2_BUCKET              bucket name, e.g. thk-web
 */
import { createHash, createHmac } from 'node:crypto'

const REGION = 'auto' // R2 has one region and expects this literal
const SERVICE = 's3'

export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    host: `${accountId}.r2.cloudflarestorage.com`,
  }
}

const sha256hex = (data) => createHash('sha256').update(data).digest('hex')
const hmac = (key, data) => createHmac('sha256', key).update(data).digest()

/**
 * Percent-encode a path segment the way SigV4 requires.
 *
 * encodeURIComponent leaves !'()* alone and S3's canonical form does not, so
 * they are finished off by hand. Object keys here are hex ids and a fixed
 * prefix, so this never actually fires — but a signature that is wrong only
 * for unusual keys is precisely the bug that is impossible to find later.
 */
const encodeSegment = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

const encodeKey = (key) => key.split('/').map(encodeSegment).join('/')

/**
 * Sign and send one request to R2.
 *
 * @param {object} opts
 * @param {'GET'|'PUT'|'DELETE'|'HEAD'} opts.method
 * @param {string}  opts.key          object key within the bucket
 * @param {Buffer=} opts.body
 * @param {string=} opts.contentType
 * @param {Record<string,string>=} opts.query
 */
export async function r2Request({ method, key, body, contentType, query }) {
  const cfg = r2Config()
  if (!cfg) throw new Error('R2 is not configured')

  const payload = body ?? Buffer.alloc(0)
  const payloadHash = sha256hex(payload)

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '') // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8)

  const canonicalUri = `/${cfg.bucket}${key ? `/${encodeKey(key)}` : ''}`
  const canonicalQuery = Object.keys(query || {})
    .sort()
    .map((k) => `${encodeSegment(k)}=${encodeSegment(query[k])}`)
    .join('&')

  // Header names must be lower-case and sorted, values trimmed. Content-Type is
  // signed only when there is one, or the signature covers a header the request
  // does not send.
  const headers = {
    host: cfg.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  if (contentType) headers['content-type'] = contentType

  const sortedNames = Object.keys(headers).sort()
  const canonicalHeaders = sortedNames.map((n) => `${n}:${String(headers[n]).trim()}\n`).join('')
  const signedHeaders = sortedNames.join(';')

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join('\n')

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, REGION)
  const kService = hmac(kRegion, SERVICE)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const url = `https://${cfg.host}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ''}`
  return fetch(url, {
    method,
    headers: { ...headers, authorization },
    body: method === 'GET' || method === 'HEAD' ? undefined : payload,
  })
}

/** Store an object. Throws with R2's own message so a failure is diagnosable. */
export async function r2Put(key, body, contentType) {
  const res = await r2Request({ method: 'PUT', key, body, contentType })
  if (!res.ok) {
    throw new Error(`R2 PUT ${key} failed: ${res.status} ${(await res.text()).slice(0, 300)}`)
  }
  return true
}

/** Fetch an object. Returns null for 404 rather than throwing, since a missing
 *  card is an ordinary outcome once the lifecycle rule has expired it. */
export async function r2Get(key) {
  const res = await r2Request({ method: 'GET', key })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`R2 GET ${key} failed: ${res.status} ${(await res.text()).slice(0, 300)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

/** Keys under a prefix, capped. Used for counting, not for listing anything to
 *  a visitor — object keys are unguessable ids and stay that way. */
export async function r2List(prefix, max = 100) {
  const res = await r2Request({
    method: 'GET',
    key: '',
    query: { 'list-type': '2', prefix, 'max-keys': String(max) },
  })
  if (!res.ok) return []
  const xml = await res.text()
  return [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1])
}
