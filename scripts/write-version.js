/**
 * Writes dist/version.json: which commit this deployment was built from.
 *
 * The admin panel publishes by committing, and Vercel then rebuilds — so after
 * pressing Publish the office is waiting for a deploy it cannot see. The panel
 * polls this file and says "live" when the commit it just made is the one
 * being served, instead of asking people to guess and refresh.
 *
 * Served no-store (vercel.json), so the answer is never a cached one.
 */
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
if (!sha) {
  try {
    sha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim()
  } catch {
    sha = 'unknown'
  }
}
writeFileSync(join(ROOT, 'dist', 'version.json'), `${JSON.stringify({ sha, builtAt: new Date().toISOString() })}\n`)
console.log(`  version.json -> ${sha.slice(0, 7)}`)
