/**
 * Check the social card of every prerendered page, against the built files.
 *
 * WHY THIS EXISTS
 * A link preview is the one part of the site that is never seen while building
 * it. Nothing renders it locally, no test covers it, and a mistake shows up only
 * when somebody has already shared the link — at which point the crawler has
 * cached the wrong card for days. Three real faults went unnoticed that way:
 *
 *   - Every one of the 21 routes fell through to the same og-image.jpg, so a
 *     shared poster link previewed as a portrait of Hari Krishna.
 *   - og:image:width and og:image:height were hardcoded to 1200x630 whatever the
 *     image actually was. True by luck while there was only one image; a lie the
 *     moment there was a second.
 *   - A card image can simply not exist in dist. The tag still looks perfectly
 *     fine in the HTML.
 *
 * So this reads the real dimensions out of the real files and compares them with
 * what the HTML claims. It runs in the build, next to the CSP check, because a
 * card that is wrong is worth failing a deploy over.
 *
 * Reads JPEG/PNG/WebP headers directly rather than pulling in a dependency —
 * enough to get width, height and byte size, which is all that is needed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')

/*
 * Crawler limits, from the platforms' own guidance.
 *
 * WhatsApp is the binding constraint and the one that matters most here, since
 * that is how this audience actually shares things. It will not render a
 * preview image much over ~600KB on many builds, and it wants the tags to
 * declare the true size because it reserves the space before the bytes arrive.
 */
const MAX_BYTES = 600 * 1024
const MIN_EDGE = 200

/** Width/height from a JPEG, PNG or WebP header. */
function imageSize(buf) {
  // PNG: IHDR is always first, at a fixed offset.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }

  // WebP: RIFF container, then VP8 / VP8L / VP8X, each storing size differently.
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fourcc = buf.toString('ascii', 12, 16)
    if (fourcc === 'VP8X') return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 }
    if (fourcc === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (fourcc === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
    }
    return null
  }

  // JPEG: walk the segment chain to a start-of-frame marker.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1
        continue
      }
      const marker = buf[i + 1]
      // SOF0..SOF15, skipping the four that are not frame headers.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        i += 2
        continue
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return null
}

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) htmlFiles(full, out)
    else if (entry.endsWith('.html')) out.push(full)
  }
  return out
}

const meta = (html, key, attr) => {
  const re = new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`, 'i')
  const m = html.match(re)
  return m ? m[1] : null
}

const problems = []
const usage = new Map()
let checked = 0

/*
 * admin.html is the office console's shell, served only on the admin host and
 * marked noindex/nofollow. It is never shared as a link, so it deliberately
 * has no preview card — checking it would be checking for a mistake.
 */
const PRIVATE_SHELLS = new Set(['admin.html'])

for (const file of htmlFiles(DIST)) {
  if (PRIVATE_SHELLS.has(path.relative(DIST, file).replace(/\\/g, '/'))) continue
  const route = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/(index)?\.html$/, '')
  const html = readFileSync(file, 'utf8')

  const og = meta(html, 'og:image', 'property')
  const tw = meta(html, 'twitter:image', 'name')
  const declaredW = Number(meta(html, 'og:image:width', 'property'))
  const declaredH = Number(meta(html, 'og:image:height', 'property'))

  if (!og) {
    problems.push(`${route}: no og:image at all`)
    continue
  }
  if (!tw) problems.push(`${route}: og:image present but twitter:image missing`)
  else if (tw !== og) problems.push(`${route}: og:image and twitter:image disagree`)

  // An object rendered into an attribute is the specific failure this caught
  // once already, and it is invisible unless you look.
  if (og.includes('[object')) {
    problems.push(`${route}: og:image is "${og}" — an object reached the attribute`)
    continue
  }
  if (!/^https?:\/\//.test(og)) {
    problems.push(`${route}: og:image "${og}" is not absolute; crawlers will not resolve it`)
    continue
  }

  usage.set(og, (usage.get(og) || 0) + 1)

  // Same-origin cards must exist in dist and match what the tags claim. An
  // off-origin card (user-generated, served from storage) cannot be checked
  // here and is left to its own endpoint.
  const local = og.replace(/^https?:\/\/[^/]+/, '')
  const onDisk = path.join(DIST, local)
  let buf
  try {
    buf = readFileSync(onDisk)
  } catch {
    problems.push(`${route}: og:image ${local} is not in dist`)
    continue
  }

  checked += 1
  const size = imageSize(buf)
  if (!size) {
    problems.push(`${route}: could not read the dimensions of ${local}`)
  } else {
    if (size.w !== declaredW || size.h !== declaredH) {
      problems.push(
        `${route}: ${local} is ${size.w}x${size.h} but the tags declare ${declaredW}x${declaredH}`,
      )
    }
    if (Math.min(size.w, size.h) < MIN_EDGE) {
      problems.push(`${route}: ${local} is ${size.w}x${size.h}; too small for a large card`)
    }
  }
  if (buf.length > MAX_BYTES) {
    problems.push(
      `${route}: ${local} is ${Math.round(buf.length / 1024)}KB, over the ${MAX_BYTES / 1024}KB ` +
        'a WhatsApp preview reliably renders',
    )
  }
}

if (problems.length) {
  console.error('\n  OG check FAILED\n')
  for (const p of problems) console.error(`    ${p}`)
  console.error('')
  process.exit(1)
}

console.log(`  OG check passed — ${checked} cards, ${usage.size} distinct`)
for (const [url, n] of [...usage].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${n.toString().padStart(2)} x ${url.replace(/^https?:\/\/[^/]+/, '')}`)
}
