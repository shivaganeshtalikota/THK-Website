/**
 * Verifies that vercel.json's CSP whitelists the inline <script> in index.html.
 *
 * WHY THIS GUARD EXISTS
 * The production CSP is `script-src 'self'` with no 'unsafe-inline', which is
 * the point — but it means the one inline script in index.html (the boot
 * script that marks scripting as available before first paint) only runs if
 * its exact sha256 is listed in the policy.
 *
 * That coupling is invisible and silent: edit the script by one character and
 * the browser blocks it with no build error, no runtime error the site can
 * see, and no visual difference on localhost — because localhost never applies
 * vercel.json's headers. The site would ship subtly broken, which is exactly
 * how the Google Fonts breakage got to production in the first place.
 *
 * It checks dist/index.html, not the source: the hash must match the bytes the
 * browser actually receives, and the build normalises CRLF line endings, which
 * changes the digest. Runs after prerender, from `npm run build`.
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8')
const csp = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
  .headers.flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy')?.value

if (!csp) {
  console.error('CSP check: no Content-Security-Policy header in vercel.json')
  process.exit(1)
}

// Executable inline scripts only. `application/ld+json` is data, never run, and
// is not subject to script-src.
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs]) => !/type\s*=\s*["']application\/ld\+json["']/i.test(attrs))
  .map(([, , body]) => body)

let failed = false
for (const body of inline) {
  // The hash is over the element's text content exactly as authored — no
  // trimming, no normalisation.
  const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`
  if (csp.includes(hash)) {
    console.log(`  inline script OK  ${hash}`)
  } else {
    failed = true
    console.error(
      `\nCSP check FAILED: an inline <script> in the built HTML is not allowed by the policy.\n` +
        `  add this to script-src in vercel.json:\n\n    '${hash}'\n`
    )
  }
}

// An inline handler (onclick=, onload=, …) cannot be whitelisted by hash at
// all — CSP ignores hashes for event handlers unless 'unsafe-hashes' is set.
// One of these on the font <link> is what silently disabled every webfont in
// production, so it is now a build failure rather than a discovery.
const markup = html.replace(/<!--[\s\S]*?-->/g, '')
const handler = markup.match(/\s(on[a-z]+)\s*=\s*["'][^"']*["']/i)
if (handler && !csp.includes("'unsafe-hashes'") && !csp.includes("'unsafe-inline'")) {
  failed = true
  console.error(
    `\nCSP check FAILED: inline event handler ${handler[1]}="…" in the built HTML.\n` +
      `  script-src has neither 'unsafe-inline' nor 'unsafe-hashes', so the browser\n` +
      `  will silently ignore it in production. Move the behaviour into a script.\n`
  )
}

if (failed) process.exit(1)
console.log('  CSP check passed')
