/**
 * Reading and committing repository files, for everything the admin panel
 * publishes.
 *
 * WHY THE REPOSITORY IS THE DATABASE
 * The site is prerendered. A photograph, a campaign poster or a line of page
 * text is not a row somewhere — it is part of a page's HTML, its social card,
 * the sitemap and the Telugu tree. Committing it gets all of that from the
 * existing build, and leaves everything published under his name in git
 * history, where it can be reviewed and reverted. Vercel redeploys on every
 * commit to main.
 *
 * ONE COMMIT PER ACTION
 * Every change here — an image and the manifest that references it — lands as
 * one commit through the git data API, so the site rebuilds once and can never
 * deploy the manifest without its image.
 *
 * TWO EDITS AT ONCE
 * Publishing is read-modify-write on a manifest. If two people in the office
 * publish in the same second, the second commit's parent is stale and GitHub
 * refuses to move the branch (422, not a fast-forward). mutateFiles() re-reads
 * and re-applies the change in that case instead of overwriting the other
 * person's work.
 *
 * Environment (Vercel > Settings > Environment Variables):
 *   GITHUB_TOKEN    fine-grained PAT, Contents: read and write, this repo only
 *   GITHUB_REPO     optional, defaults to shivaganeshtalikota/THK-Website
 *   GITHUB_BRANCH   optional, defaults to main
 *
 * GITHUB_LOCAL_DIR (testing only, never on Vercel) points every read and write
 * at a folder instead, so the whole panel can be exercised without a token.
 */
import { promises as fs } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'

const REPO = process.env.GITHUB_REPO || 'shivaganeshtalikota/THK-Website'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const LOCAL = process.env.GITHUB_LOCAL_DIR ? resolve(process.env.GITHUB_LOCAL_DIR) : null

/** A repository path must be relative, forward-slashed and stay inside the repo. */
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._\-/]+$/

export const githubReady = () => Boolean(LOCAL || process.env.GITHUB_TOKEN)

class ConflictError extends Error {}

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'thk-website-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (res.status === 422 && init.method === 'PATCH') throw new ConflictError('branch moved')
  if (!res.ok) {
    // GitHub's message can carry repository detail; it goes to the log, never
    // to the browser.
    throw new Error(`GitHub ${init.method || 'GET'} ${path} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return res.status === 204 ? null : res.json()
}

function localPath(path) {
  if (!SAFE_PATH.test(path)) throw new Error(`Unsafe repository path: ${path}`)
  const p = resolve(LOCAL, ...path.split('/'))
  if (!p.startsWith(LOCAL + sep)) throw new Error(`Unsafe repository path: ${path}`)
  return p
}

/** The commit the branch points at right now. */
async function head() {
  if (LOCAL) return 'local'
  const ref = await api(`/repos/${REPO}/git/ref/heads/${BRANCH}`)
  return ref.object.sha
}

/**
 * A text file at a given commit, or null if it does not exist there.
 *
 * Read at a pinned commit rather than "the branch", so a manifest and the
 * commit it will be written on top of always agree.
 */
async function readAt(path, sha) {
  if (!SAFE_PATH.test(path)) throw new Error(`Unsafe repository path: ${path}`)
  if (LOCAL) {
    try {
      return await fs.readFile(localPath(path), 'utf8')
    } catch (e) {
      if (e.code === 'ENOENT') return null
      throw e
    }
  }
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        // raw: the file's bytes directly, with no 1MB ceiling on content
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'thk-website-admin',
      },
    },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub read ${path} -> ${res.status}`)
  return res.text()
}

/** Read the current version of several text files at once. */
export async function readFiles(paths) {
  const sha = await head()
  const out = {}
  await Promise.all(
    paths.map(async (p) => {
      out[p] = await readAt(p, sha)
    }),
  )
  return { sha, files: out }
}

/**
 * Write files as one commit on top of `parent`.
 *
 * @param {Array<{path:string, content:string|Buffer}>} files
 *        a string is committed as UTF-8 text; a Buffer as binary
 */
async function commitOn(parent, files, message) {
  for (const f of files) {
    if (!SAFE_PATH.test(f.path)) throw new Error(`Unsafe repository path: ${f.path}`)
  }

  if (LOCAL) {
    for (const f of files) {
      const p = localPath(f.path)
      await fs.mkdir(dirname(p), { recursive: true })
      await fs.writeFile(p, f.content)
    }
    return `local-${Date.now().toString(36)}`
  }

  const parentCommit = await api(`/repos/${REPO}/git/commits/${parent}`)
  const tree = []
  for (const f of files) {
    if (Buffer.isBuffer(f.content)) {
      const blob = await api(`/repos/${REPO}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: f.content.toString('base64'), encoding: 'base64' }),
      })
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
    } else {
      tree.push({ path: f.path, mode: '100644', type: 'blob', content: String(f.content) })
    }
  }
  const newTree = await api(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
  })
  const commit = await api(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
  })
  // force:false — refuses unless this is a fast-forward, which is exactly the
  // check that stops a stale read overwriting somebody else's publish.
  await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })
  return commit.sha
}

/**
 * Read some files, let `change` decide what to write, commit — and if the
 * branch moved underneath, do it all again against the new state.
 *
 * `change(files)` receives { path: text|null } and returns
 * { files: [{path, content}], message, result } or null to write nothing.
 * It must be safe to call more than once.
 */
export async function mutateFiles(paths, change, { attempts = 3 } = {}) {
  let lastErr
  for (let i = 0; i < attempts; i += 1) {
    const sha = await head()
    const current = {}
    await Promise.all(
      paths.map(async (p) => {
        current[p] = await readAt(p, sha)
      }),
    )
    const plan = await change(current)
    if (!plan) return { commit: null, result: undefined }
    try {
      const commit = await commitOn(sha, plan.files, plan.message)
      return { commit, result: plan.result }
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err
      lastErr = err
    }
  }
  throw lastErr || new Error('Could not commit after several attempts')
}
