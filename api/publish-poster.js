import { requireAdmin } from '../server/admin-auth.js'
import { imageSize, isJpeg } from '../server/image.js'
import { MANIFEST_PATH, parseManifest, serializeManifest } from '../server/campaign-manifest.js'

/**
 * Publishes a new campaign poster from the admin panel.
 *
 * WHY A COMMIT, AS WITH EVERYTHING ELSE HERE
 * The site is prerendered: a poster is not a database row, it is a route with
 * its own HTML, its own social card, an entry in the sitemap and a place in the
 * Telugu tree. Committing the artwork and the manifest gets all of that from the
 * existing build, and leaves the campaign in git history — which for material
 * published under a politician's name is worth having. api/publish.js takes the
 * same approach for photographs and written updates.
 *
 * WHY A SEPARATE ENDPOINT
 * publish.js owns uploads.json and the photo/update semantics around it. Posters
 * are a different shape with a different manifest, and threading a third kind
 * through that file would have meant touching the code that already publishes
 * his gallery. The credential check is shared — see server/admin-auth.js, where
 * it now lives precisely so there is only one of it.
 *
 * WHAT THE BROWSER SENDS, AND WHY IT RENDERS THE CARD
 * Two images: the event artwork as uploaded, and a 1200x630 social card the
 * admin panel has already composed. The card is made in the browser because the
 * only other renderer in this stack is a Pillow without raqm, which reorders
 * Telugu conjuncts — the same reason the supporter-facing cards are made
 * browser-side. Nothing here draws type.
 *
 * Environment (Vercel > Settings > Environment Variables):
 *   ADMIN_PASSWORD, ADMIN_ID   as for api/publish.js
 *   GITHUB_TOKEN               fine-grained PAT, Contents: read and write
 *   GITHUB_REPO, GITHUB_BRANCH optional
 */

const REPO = process.env.GITHUB_REPO || 'shivaganeshtalikota/THK-Website'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const MANIFEST = MANIFEST_PATH
const POSTER_DIR = 'public/posters'

/** Vercel caps a function request body at ~4.5MB and both images travel base64,
 *  which inflates by a third. This leaves comfortable headroom. */
const MAX_ARTWORK_BYTES = 2 * 1024 * 1024
const MAX_CARD_BYTES = 400 * 1024

const CARD_W = 1200
const CARD_H = 630

const api = async (path, token, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'thk-website-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`GitHub ${init.method || 'GET'} ${path} failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  }
  return res.json()
}

const SLUG = /^[a-z0-9][a-z0-9-]{1,47}$/

function decodeImage(value) {
  if (!value) return null
  const b64 = String(value).includes(',') ? String(value).split(',')[1] : String(value)
  try {
    return { base64: b64, buf: Buffer.from(b64, 'base64') }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}

  const denied = await requireAdmin(req, body)
  if (denied) return res.status(denied.status).json({ error: denied.error })

  const { GITHUB_TOKEN } = process.env
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server is not configured. GITHUB_TOKEN must be set in Vercel.' })
  }

  const action = body.action === 'delete' ? 'delete' : 'create'
  const slug = String(body.slug || '').trim()
  if (!SLUG.test(slug)) {
    return res.status(400).json({ error: 'The web address must be lowercase letters, numbers and hyphens.' })
  }

  /* ---------------------------------------------------------------- read */
  const manifestFile = await api(
    `/repos/${REPO}/contents/${MANIFEST}?ref=${BRANCH}`,
    GITHUB_TOKEN,
  ).catch(() => null)

  let manifest = { posters: [] }
  if (manifestFile?.content) {
    try {
      manifest = parseManifest(Buffer.from(manifestFile.content, 'base64').toString('utf8'))
    } catch {
      return res.status(500).json({ error: 'The poster manifest could not be read.' })
    }
  }
  if (!Array.isArray(manifest.posters)) manifest.posters = []

  const treeItems = []
  let commitVerb

  if (action === 'delete') {
    const before = manifest.posters.length
    const removed = manifest.posters.find((p) => p.slug === slug)
    manifest.posters = manifest.posters.filter((p) => p.slug !== slug)
    if (manifest.posters.length === before) {
      return res.status(404).json({ error: 'No poster with that address.' })
    }
    // The artwork files are left in place deliberately: unreferencing them is
    // what "removed" means here, and anything already shared keeps rendering
    // rather than turning into a broken image in somebody's WhatsApp history.
    commitVerb = `Remove poster: ${removed?.titleEn || slug}`
  } else {
    const title = String(body.title || '').trim()
    const titleEn = String(body.titleEn || '').trim()
    const summary = String(body.summary || '').trim()
    const issue = String(body.issue || '').trim().slice(0, 24)
    const date = String(body.date || '').trim().slice(0, 40)
    const geometry = body.geometry

    if (titleEn.length < 3) {
      return res.status(400).json({ error: 'An English title of at least 3 characters is required.' })
    }
    if (!geometry || !geometry.photoSlot || !geometry.name) {
      return res.status(400).json({ error: 'The layout was missing. Reload the panel and try again.' })
    }
    if (manifest.posters.some((p) => p.slug === slug)) {
      return res.status(409).json({ error: 'A poster already uses that web address.' })
    }

    const artwork = decodeImage(body.artwork)
    const card = decodeImage(body.card)
    if (!artwork || !card) {
      return res.status(400).json({ error: 'Both the artwork and its preview card are required.' })
    }

    // Real first bytes, not the declared type — the same check the rest of this
    // codebase makes on anything uploaded.
    if (!isJpeg(artwork.buf)) return res.status(415).json({ error: 'The artwork must be a JPEG.' })
    if (!isJpeg(card.buf)) return res.status(415).json({ error: 'The preview card must be a JPEG.' })
    if (artwork.buf.length > MAX_ARTWORK_BYTES) {
      return res.status(413).json({ error: 'The artwork is too large. Keep it under 2 MB.' })
    }
    if (card.buf.length > MAX_CARD_BYTES) {
      return res.status(413).json({ error: 'The preview card is too large.' })
    }

    const artSize = imageSize(artwork.buf)
    const cardSize = imageSize(card.buf)
    if (!artSize) return res.status(400).json({ error: 'The artwork could not be read.' })
    if (!cardSize || cardSize.w !== CARD_W || cardSize.h !== CARD_H) {
      return res.status(400).json({ error: `The preview card must be ${CARD_W}x${CARD_H}.` })
    }

    for (const [path, content] of [
      [`${POSTER_DIR}/${slug}-v1.jpg`, artwork.base64],
      [`${POSTER_DIR}/${slug}-card-v1.jpg`, card.base64],
    ]) {
      const blob = await api(`/repos/${REPO}/git/blobs`, GITHUB_TOKEN, {
        method: 'POST',
        body: JSON.stringify({ content, encoding: 'base64' }),
      })
      treeItems.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
    }

    manifest.posters.unshift({
      slug,
      title: title || titleEn,
      titleEn,
      summary,
      issue: issue || 'Campaign',
      date,
      version: 1,
      width: artSize.w,
      height: artSize.h,
      templateVersion: body.templateVersion ?? 1,
      publishedAt: new Date().toISOString(),
      ...geometry,
    })
    commitVerb = `Add poster: ${titleEn}`
  }

  /* --------------------------------------------------------------- write */
  treeItems.push({
    path: MANIFEST,
    mode: '100644',
    type: 'blob',
    content: serializeManifest(manifest),
  })

  try {
    const ref = await api(`/repos/${REPO}/git/ref/heads/${BRANCH}`, GITHUB_TOKEN)
    const headCommit = await api(`/repos/${REPO}/git/commits/${ref.object.sha}`, GITHUB_TOKEN)
    const tree = await api(`/repos/${REPO}/git/trees`, GITHUB_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeItems }),
    })
    const commit = await api(`/repos/${REPO}/git/commits`, GITHUB_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ message: commitVerb, tree: tree.sha, parents: [ref.object.sha] }),
    })
    await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, GITHUB_TOKEN, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    })
  } catch (err) {
    console.error('publish-poster:', err)
    return res.status(502).json({ error: 'The poster could not be published. Nothing was changed.' })
  }

  return res.status(200).json({
    ok: true,
    slug,
    url: `/posters/${slug}`,
    // The page does not exist until Vercel has rebuilt, and the panel says so
    // rather than handing over a link that 404s for the next two minutes.
    note: 'Published. The page appears once the site finishes rebuilding, usually a minute or two.',
  })
}
