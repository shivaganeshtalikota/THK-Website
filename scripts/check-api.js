/**
 * Load every serverless function in plain Node, the way Vercel will.
 *
 * WHY THIS EXISTS
 * The site's pages are built by Vite, which forgives things plain Node does not.
 * A bare JSON import is the example that bit: Vite bundled it happily, every page
 * built and rendered, and meanwhile the two functions that import the poster data
 * crashed on load — so every personalised share link returned 500 in production
 * while the build reported success. Nothing in the pipeline ever imported the
 * functions the way the runtime does.
 *
 * This does, first, before anything else in the build. A function that cannot
 * load now fails the deploy instead of failing the visitor.
 *
 * It only imports; it never calls a handler, so no network request is made and
 * no environment variable is needed.
 */
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = join(ROOT, 'api')

const files = readdirSync(API).filter((f) => f.endsWith('.js'))
const failures = []

for (const file of files) {
  try {
    const mod = await import(pathToFileURL(join(API, file)).href)
    if (typeof mod.default !== 'function') {
      failures.push(`${file}: loads, but has no default-exported handler`)
    }
  } catch (err) {
    failures.push(`${file}: ${err?.code ? `${err.code} — ` : ''}${String(err?.message || err).split('\n')[0]}`)
  }
}

/*
 * The campaign manifest is machine-written and machine-read: publishing reads
 * it, appends, and writes it back. If the committed file ever stops parsing,
 * the NEXT publish fails, long after whatever broke it. So every build proves
 * the file on disk parses, and that the format survives a round trip.
 */
try {
  const { readFileSync } = await import('node:fs')
  const { parseManifest, serializeManifest, MANIFEST_PATH } = await import(
    pathToFileURL(join(ROOT, 'server', 'campaign-manifest.js')).href
  )
  const onDisk = parseManifest(readFileSync(join(ROOT, MANIFEST_PATH), 'utf8'))
  const again = parseManifest(serializeManifest(onDisk))
  if (JSON.stringify(again) !== JSON.stringify(onDisk)) {
    failures.push(`${MANIFEST_PATH}: does not survive a serialise/parse round trip`)
  }
} catch (err) {
  failures.push(`campaign manifest: ${String(err?.message || err).split('\n')[0]}`)
}

if (failures.length) {
  console.error('\n  API check FAILED — these functions would crash on Vercel:\n')
  for (const f of failures) console.error(`    ${f}`)
  console.error('')
  process.exit(1)
}
console.log(`  API check passed — ${files.length} functions load in plain Node`)
