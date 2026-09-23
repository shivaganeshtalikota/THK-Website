/**
 * Talking to /api/admin.
 *
 * Every request carries the X-THK-Admin header (the API refuses any POST
 * without it — part of its CSRF defence) and the session cookie, which the
 * browser attaches by itself: the cookie is HttpOnly, so nothing in this
 * bundle can read it, and that is the point.
 *
 * A 401 anywhere means the session has lapsed; it is announced once, and the
 * app returns to the sign-in screen instead of every page handling it.
 */

const listeners = new Set()
export const onSignedOut = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const signedOut = () => listeners.forEach((fn) => fn())

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(op, body, { method = body === undefined ? 'GET' : 'POST' } = {}) {
  let res
  try {
    res = await fetch(`/api/admin?op=${encodeURIComponent(op)}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'X-THK-Admin': '1',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    })
  } catch {
    throw new ApiError('No connection. Check the internet and try again.', 0)
  }
  let data = {}
  try {
    data = await res.json()
  } catch {
    // not JSON — fall through with the status
  }
  if (res.status === 401 && !['login', 'verify', 'enroll-confirm', 'security-recovery', 'security-reset'].includes(op)) {
    signedOut()
  }
  if (!res.ok) throw new ApiError(data.error || `That did not work (${res.status}).`, res.status)
  return data
}

/* ------------------------------------------------------------- uploads */

const PART = 3.5 * 1024 * 1024

function randomId() {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256Hex(blob) {
  const buf = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function sendPart(url, chunk, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.setRequestHeader('X-THK-Admin', '1')
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.responseType = 'json'
    xhr.timeout = 180_000
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded)
    xhr.onload = () => {
      if (xhr.status === 200) resolve()
      else {
        if (xhr.status === 401) signedOut()
        reject(new ApiError(xhr.response?.error || `Upload failed (${xhr.status}).`, xhr.status))
      }
    }
    xhr.onerror = () => reject(new ApiError('The connection dropped during the upload.', 0))
    xhr.ontimeout = () => reject(new ApiError('The upload timed out.', 0))
    xhr.send(chunk)
  })
}

/**
 * Upload a file in parts, reporting progress 0..1. Parts are staged in R2
 * under this session and put together by the server when the item is
 * published — which is how files far above Vercel's 4.5MB request limit get
 * through. Each part is retried twice before giving up.
 *
 * @returns {Promise<{id: string, parts: number, sha256: string}>}
 */
export async function uploadBlob(blob, onProgress) {
  const id = `${Date.now().toString(36)}-${randomId()}`
  const parts = Math.max(1, Math.ceil(blob.size / PART))
  let done = 0
  for (let n = 0; n < parts; n += 1) {
    const chunk = blob.slice(n * PART, Math.min(blob.size, (n + 1) * PART))
    let attempt = 0
    for (;;) {
      try {
        await sendPart(`/api/admin?op=upload&id=${encodeURIComponent(id)}&n=${n}`, chunk, (loaded) =>
          onProgress?.(Math.min(0.99, (done + loaded) / blob.size)),
        )
        break
      } catch (err) {
        attempt += 1
        if (attempt > 2 || err.status === 401 || err.status === 413) throw err
        await new Promise((r) => setTimeout(r, 800 * attempt))
      }
    }
    done += chunk.size
  }
  const sha256 = await sha256Hex(blob)
  onProgress?.(1)
  return { id, parts, sha256 }
}

/* ------------------------------------------------------------ live check */

/**
 * Wait until the public site is serving `commit` — or anything newer.
 *
 * Publishing is a commit; Vercel then rebuilds. The build writes
 * /version.json with the commit it came from, so polling it answers "is my
 * change live yet?" exactly. History on main is linear, so a deployment built
 * AFTER this publish from a different, later commit also contains it (two
 * quick publishes in a row would otherwise wait for a build that never comes).
 * Local test commits ("local-…") count as live at once.
 * Resolves true when live, false after `timeoutMs`.
 */
export async function waitForLive(commit, { timeoutMs = 6 * 60_000, onTick } = {}) {
  if (!commit) return false
  if (String(commit).startsWith('local-')) return true
  const started = Date.now()
  const readVersion = async () => {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    return r.ok ? r.json() : null
  }
  let before = null
  try {
    before = (await readVersion())?.sha || null
  } catch {
    // unknown; fine
  }
  while (Date.now() - started < timeoutMs) {
    try {
      const v = await readVersion()
      if (v?.sha === commit) return true
      if (v?.sha && before && v.sha !== before && Date.parse(v.builtAt) > started) return true
    } catch {
      // keep waiting
    }
    onTick?.(Date.now() - started)
    await new Promise((r) => setTimeout(r, 6000))
  }
  return false
}
