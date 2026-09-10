import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Publishes a gallery photograph or a written update by committing it to the
 * repository, which Vercel then redeploys automatically.
 *
 * WHY A COMMIT RATHER THAN A DATABASE
 * The site is a static build: every page is prerendered and every photograph
 * goes through a build-time pipeline. Content that lives in the repository gets
 * all of that for free — prerendering, the entity graph, the CDN caching rules
 * — and stays reviewable in git history, which matters for a politician's site
 * where anything published is on the record. A database would need a second
 * runtime and would sit outside all of it.
 *
 * SECURITY
 * - GITHUB_TOKEN and ADMIN_PASSWORD are server-side environment variables. This
 *   file runs only on Vercel; neither value is ever sent to the browser.
 * - The repository is PUBLIC, so the token must be a fine-grained PAT scoped to
 *   Contents: read and write on this one repository and nothing else.
 * - The password is compared with a timing-safe digest comparison, so a wrong
 *   guess takes the same time as a right one.
 * - Uploads are capped and their type is checked against the actual magic
 *   bytes, not the filename or the declared MIME type.
 *
 * Required environment variables (Vercel > Settings > Environment Variables):
 *   ADMIN_PASSWORD   a long random string
 *   GITHUB_TOKEN     fine-grained PAT, Contents: read and write, this repo only
 *   GITHUB_REPO      optional, defaults to shivaganeshtalikota/THK-Website
 *   GITHUB_BRANCH    optional, defaults to main
 */

const REPO = process.env.GITHUB_REPO || 'shivaganeshtalikota/THK-Website'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const MANIFEST = 'src/data/uploads.json'
const UPLOAD_DIR = 'public/photos/uploads'

const MAX_BYTES = 4 * 1024 * 1024 // Vercel caps a function request body at ~4.5MB

// Checked against the file's real first bytes rather than its name.
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { ext: 'png', mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'webp', mime: 'image/webp', magic: [0x52, 0x49, 0x46, 0x46] },
]

const api = async (path, token, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'thk-website-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`GitHub ${init.method ?? 'GET'} ${path} -> ${res.status}: ${detail.slice(0, 300)}`)
  }
  return res.json()
}

/** Constant-time password check. Digest first so lengths always match. */
const passwordOk = (given, expected) => {
  if (typeof given !== 'string' || !expected) return false
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/**
 * ASCII slug, with a fallback for titles that have no Latin characters.
 *
 * The first real upload was titled in Telugu and slugified to "25-25" — every
 * letter was stripped and only the digits survived, which is meaningless and
 * would collide with the next Telugu title containing the same numbers. The
 * filename has to stay ASCII (Telugu percent-encodes into 200-character URLs,
 * which git on Windows would not index earlier in this project), so when the
 * slug degenerates it falls back to a short digest of the original title.
 */
const slugify = (value) => {
  const raw = String(value ?? '')
  const ascii = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const letters = ascii.replace(/[^a-z]/g, '')
  if (letters.length >= 3) return ascii
  const digest = createHash('sha256').update(raw).digest('hex').slice(0, 8)
  return ascii ? `${ascii}-${digest}` : digest
}

const CATEGORIES = ['party', 'constituency', 'temple', 'culture', 'press']

/** Sources arrive as [{label, url}]; keep only entries with a real http(s) URL. */
const cleanSources = (list) =>
  (Array.isArray(list) ? list : [])
    .map((s) => ({
      label: String(s?.label ?? '').trim().slice(0, 120),
      url: String(s?.url ?? '').trim(),
    }))
    .filter((s) => /^https?:\/\/[^\s]+$/i.test(s.url))
    .slice(0, 8)

const detect = (buf) =>
  SIGNATURES.find((s) => s.magic.every((byte, i) => buf[i] === byte)) ?? null

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

  const { ADMIN_PASSWORD, ADMIN_ID, GITHUB_TOKEN } = process.env
  if (!ADMIN_PASSWORD || !GITHUB_TOKEN) {
    return res.status(500).json({
      error: 'Server is not configured. ADMIN_PASSWORD and GITHUB_TOKEN must be set in Vercel.',
    })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
  const { adminId, password, action = 'create', id: targetId } = body
  const { kind, title, description, image, category, sources } = body

  // ADMIN_ID is optional: if it is set in the environment it must match, so the
  // panel needs both halves. Both comparisons are constant-time.
  const ip = clientIp(req)
  if (lockedOut(ip)) {
    await penalty()
    return res.status(429).json({ error: 'Too many attempts. Try again in fifteen minutes.' })
  }
  if ((ADMIN_ID && !passwordOk(adminId, ADMIN_ID)) || !passwordOk(password, ADMIN_PASSWORD)) {
    noteFailure(ip)
    await penalty()
    return res.status(401).json({ error: 'Wrong ID or password.' })
  }
  ATTEMPTS.delete(ip)
  if (!['create', 'update', 'delete', 'list'].includes(action)) {
    return res.status(400).json({ error: 'Unknown action.' })
  }
  if (action !== 'list' && kind !== 'photo' && kind !== 'update') {
    return res.status(400).json({ error: 'kind must be "photo" or "update".' })
  }
  if ((action === 'update' || action === 'delete') && !targetId) {
    return res.status(400).json({ error: 'An id is required to edit or remove an entry.' })
  }
  if (action === 'create' || action === 'update') {
    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({ error: 'A title of at least 3 characters is required.' })
    }
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}.` })
    }
  }

  // Validate the upload BEFORE any network call, so a bad file returns the real
  // reason rather than a generic failure from further down the pipeline.
  let base64 = null
  let buf = null
  let sig = null
  // On edit the image is optional — the caption, category or sources may be all
  // that is changing, and re-uploading the file to fix a typo would be absurd.
  if (kind === 'photo' && (action === 'create' || image)) {
    if (!image) return res.status(400).json({ error: 'An image file is required.' })
    base64 = String(image).includes(',') ? String(image).split(',')[1] : String(image)
    buf = Buffer.from(base64, 'base64')
    if (buf.length === 0) return res.status(400).json({ error: 'The image was empty.' })
    if (buf.length > MAX_BYTES) {
      return res.status(413).json({
        error: `That image is ${(buf.length / 1024 / 1024).toFixed(1)}MB. The limit is 4MB — please resize it first.`,
      })
    }
    sig = detect(buf)
    if (!sig) {
      return res.status(415).json({ error: 'That file is not a JPEG, PNG or WebP image.' })
    }
  }

  try {
    // ---- read the current manifest and branch head ------------------------
    const ref = await api(`/repos/${REPO}/git/ref/heads/${BRANCH}`, GITHUB_TOKEN)
    const headSha = ref.object.sha
    const headCommit = await api(`/repos/${REPO}/git/commits/${headSha}`, GITHUB_TOKEN)

    let manifest = { photos: [], updates: [] }
    try {
      const file = await api(
        `/repos/${REPO}/contents/${MANIFEST}?ref=${BRANCH}`,
        GITHUB_TOKEN
      )
      manifest = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
    } catch {
      // First publish: the manifest does not exist yet. The default above is
      // committed as part of this same commit.
    }
    manifest.photos ??= []
    manifest.updates ??= []

    // `list` needs nothing else — hand back what is published so the panel can
    // show it for editing.
    if (action === 'list') {
      return res.status(200).json({ ok: true, ...manifest })
    }

    const now = new Date().toISOString()
    const treeItems = []
    let addedPath = null
    let commitVerb = action

    const collection = kind === 'photo' ? manifest.photos : manifest.updates
    const existingIndex = targetId ? collection.findIndex((e) => e.id === targetId) : -1

    if ((action === 'update' || action === 'delete') && existingIndex === -1) {
      return res.status(404).json({ error: 'That entry no longer exists.' })
    }

    if (action === 'delete') {
      const [removed] = collection.splice(existingIndex, 1)
      // The image file is deliberately left in the repository. Removing a blob
      // needs the full tree walked to rebuild it without that path, and an
      // orphaned 140KB file is a far smaller problem than a delete that half
      // succeeds. It stops being referenced, which is what "removed" means here.
      commitVerb = `Remove ${kind}: ${removed.title}`
    } else if (action === 'update') {
      const entry = collection[existingIndex]
      entry.title = String(title).trim()
      if (kind === 'photo') entry.description = String(description ?? '').trim()
      else entry.summary = String(description ?? '').trim()
      entry.category = category || entry.category || (kind === 'photo' ? 'party' : undefined)
      entry.sources = cleanSources(sources)
      entry.updatedAt = now

      // A replacement image keeps the entry's id, so links to it stay valid.
      if (kind === 'photo' && base64) {
        addedPath = `${UPLOAD_DIR}/${entry.id}.${sig.ext}`
        const blob = await api(`/repos/${REPO}/git/blobs`, GITHUB_TOKEN, {
          method: 'POST',
          body: JSON.stringify({ content: base64, encoding: 'base64' }),
        })
        treeItems.push({ path: addedPath, mode: '100644', type: 'blob', sha: blob.sha })
        entry.src = `/photos/uploads/${entry.id}.${sig.ext}`
        entry.bytes = buf.length
      }
      commitVerb = `Edit ${kind}: ${entry.title}`
    } else {
      // create
      const id = `${now.slice(0, 10)}-${slugify(title)}`
      if (collection.some((e) => e.id === id)) {
        return res.status(409).json({ error: 'Something with that title was already published today.' })
      }
      const common = {
        id,
        title: String(title).trim(),
        category: category || (kind === 'photo' ? 'party' : undefined),
        sources: cleanSources(sources),
        publishedAt: now,
      }
      if (kind === 'photo') {
        addedPath = `${UPLOAD_DIR}/${id}.${sig.ext}`
        const blob = await api(`/repos/${REPO}/git/blobs`, GITHUB_TOKEN, {
          method: 'POST',
          body: JSON.stringify({ content: base64, encoding: 'base64' }),
        })
        treeItems.push({ path: addedPath, mode: '100644', type: 'blob', sha: blob.sha })
        collection.unshift({
          ...common,
          description: String(description ?? '').trim(),
          src: `/photos/uploads/${id}.${sig.ext}`,
          bytes: buf.length,
        })
      } else {
        collection.unshift({
          ...common,
          summary: String(description ?? '').trim(),
          date: now.slice(0, 10),
        })
      }
      commitVerb = `Publish ${kind}: ${String(title).trim()}`
    }

    // ---- manifest + image land in ONE commit, so Vercel deploys once ------
    const manifestBlob = await api(`/repos/${REPO}/git/blobs`, GITHUB_TOKEN, {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`).toString('base64'),
        encoding: 'base64',
      }),
    })
    treeItems.push({ path: MANIFEST, mode: '100644', type: 'blob', sha: manifestBlob.sha })

    const tree = await api(`/repos/${REPO}/git/trees`, GITHUB_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeItems }),
    })
    const commit = await api(`/repos/${REPO}/git/commits`, GITHUB_TOKEN, {
      method: 'POST',
      body: JSON.stringify({
        message: `${commitVerb}\n\nFrom the admin panel.`,
        tree: tree.sha,
        parents: [headSha],
      }),
    })
    await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, GITHUB_TOKEN, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    })

    return res.status(200).json({
      ok: true,
      commit: commit.sha.slice(0, 7),
      path: addedPath,
      message: 'Published. The site rebuilds automatically and will show it in a minute or two.',
    })
  } catch (err) {
    // The message can carry GitHub's response; keep it out of the client.
    console.error('publish failed:', err)
    return res.status(502).json({ error: 'Could not publish. Please try again.' })
  }
}
