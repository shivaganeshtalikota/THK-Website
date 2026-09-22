/**
 * Draws a finished poster onto a canvas: artwork, cut-out person, name, designation.
 *
 * Pure and synchronous once its inputs are loaded, so the same function renders
 * both the on-screen preview and the full-resolution download. Drawing the
 * preview through a different code path than the export is how a poster ends up
 * looking right on screen and wrong in the downloaded file.
 *
 * TAINTING. Everything drawn here is either same-origin (/posters/*.jpg) or a
 * blob: / data: URL made from the visitor's own upload. Both are untainted
 * origins, so canvas.toBlob() stays legal. Drawing a cross-origin image without
 * CORS would taint the canvas and make the export throw a SecurityError — which
 * is why the artwork is served from our own /public and never hot-linked.
 */

/** Load an <img> and resolve only once it has actually decoded. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Harmless for same-origin, and required if the artwork is ever moved to a
    // CDN — without it that move would silently taint every export.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.src = src
  })
}

/**
 * Make sure the faces the poster uses are actually loaded before any text is
 * drawn.
 *
 * Canvas does not wait for webfonts. fillText with a font that has not loaded
 * silently falls back to a system face, and the download is then set in the
 * wrong typeface — usually one with no Telugu coverage at all, which renders as
 * tofu boxes. Nothing about the drawing code reveals this; it just comes out
 * wrong. So the fonts are demanded up front.
 */
export async function ensureFonts(sizes = [64, 40]) {
  if (typeof document === 'undefined' || !document.fonts) return
  const families = ['Inter', 'Noto Sans Telugu']
  await Promise.all(
    families.flatMap((family) =>
      sizes.flatMap((size) =>
        [400, 500, 700].map((weight) =>
          document.fonts.load(`${weight} ${size}px "${family}"`).catch(() => {})
        )
      )
    )
  )
  await document.fonts.ready
}

/** True if the string contains any Telugu codepoint. */
const hasTelugu = (s) => /[ఀ-౿]/.test(s)

/**
 * The font stack for a given string.
 *
 * Telugu is not a styling preference here — Inter carries no Telugu glyphs, so a
 * Telugu name set in Inter renders as empty boxes. The script decides the face.
 */
const fontFor = (text, weight, px) =>
  hasTelugu(text)
    ? `${weight} ${px}px "Noto Sans Telugu", "Noto Sans", sans-serif`
    : `${weight} ${px}px Inter, system-ui, sans-serif`

/**
 * Draw one line of text, shrinking it until it fits its box.
 *
 * Names vary wildly in length — "Ravi" and
 * "డా. చెరుకువాడ శ్రీరంగనాథ రాజు" go in the same slot. Wrapping would push into
 * the party mark below, so the type scales down instead, to a floor of 55% where
 * it stops being legible and is truncated rather than shrunk into nothing.
 */
function drawFittedLine(ctx, text, box, W, H) {
  if (!text) return
  const maxW = box.maxW * W
  let px = box.size * H
  const floor = px * 0.55

  ctx.textAlign = box.align || 'left'
  ctx.textBaseline = box.baseline || 'alphabetic'
  ctx.fillStyle = box.color

  ctx.font = fontFor(text, box.weight, px)
  while (ctx.measureText(text).width > maxW && px > floor) {
    px -= 1
    ctx.font = fontFor(text, box.weight, px)
  }

  let out = text
  if (ctx.measureText(out).width > maxW) {
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1)
    out = `${out}…`
  }

  // A soft shadow so the type holds up over the black band even if the artwork
  // behind it is ever changed to something lighter.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = Math.max(2, H * 0.002)
  ctx.fillText(out, box.x * W, box.y * H)
  ctx.restore()
}

/**
 * Fit a cut-out inside a box, anchored at its bottom edge.
 *
 * CONTAIN, not cover. Cover was right when the artwork still had a filled white
 * silhouette underneath — letterboxing would have left that white showing. The
 * silhouette is gone now, so there is nothing behind the person to reveal, and
 * cover only means cropping a shoulder off at the frame edge for no gain.
 * Contain keeps the whole subject.
 *
 * Bottom-anchored because a head-and-shoulders photo belongs sitting on the base
 * of the slot; centring it vertically leaves the subject floating.
 */
function coverInto(ctx, img, slot, W, H) {
  const bx = slot.x * W
  const by = slot.y * H
  const bw = slot.w * W
  const bh = slot.h * H

  const scale = Math.min(bw / img.width, bh / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const dx = bx + (bw - dw) / 2
  const dy = slot.anchor === 'bottom' ? by + bh - dh : by + (bh - dh) / 2

  ctx.save()
  // Clip so an over-tall portrait cannot spill up over the artwork's headline.
  ctx.beginPath()
  ctx.rect(bx, by, bw, bh)
  ctx.clip()
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()
}

/**
 * The footer band, for posters whose artwork does not carry one.
 *
 * Solid rather than a gradient, and opaque rather than translucent, because it
 * has to hold white text legibly over an artwork nobody has seen yet. A
 * translucent band looks better over a dark photograph and becomes unreadable
 * over a bright one, and the whole point here is that it must work on every
 * image somebody uploads without anyone checking.
 *
 * The party mark is drawn at its own aspect ratio rather than squashed into a
 * square — it is a real logo with proportions, and a stretched party emblem on
 * campaign material is the kind of thing people notice.
 */
function drawBand(ctx, band, logo, W, H) {
  const top = band.y * H

  ctx.save()
  ctx.fillStyle = band.color || '#0E0E0E'
  ctx.fillRect(0, top, W, H - top)

  if (band.accent) {
    ctx.fillStyle = band.accent
    ctx.fillRect(0, top, W, Math.max(2, (band.accentH || 0.005) * H))
  }

  if (logo && band.logo) {
    const boxW = band.logo.w * W
    const scale = boxW / logo.width
    const drawW = boxW
    const drawH = logo.height * scale
    const x = band.logo.x * W
    // Centred in the band rather than aligned to the type, so it reads as a
    // mark on the strip and not as a bullet before the name.
    const y = top + (H - top - drawH) / 2
    ctx.drawImage(logo, x, y, drawW, drawH)
  }
  ctx.restore()
}

/**
 * Compose the whole poster.
 *
 * @param {object}            opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {object}            opts.poster       entry from src/data/posters.js
 * @param {HTMLImageElement}  opts.artwork      the base artwork, already loaded
 * @param {HTMLImageElement=} opts.person       the cut-out, already loaded
 * @param {string}            opts.name
 * @param {string}            opts.designation
 * @param {number=}           opts.scale        1 = full artwork resolution
 */
export function renderPoster({
  canvas,
  poster,
  artwork,
  person,
  name,
  designation,
  logo,
  scale = 1,
}) {
  const W = Math.round(poster.width * scale)
  const H = Math.round(poster.height * scale)
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  /*
   * Artwork, band, person, type — in that order.
   *
   * For the 22A poster the artwork is the CLEANED one: its white silhouette and
   * its placeholder name were both painted out in preprocessing, so there is
   * nothing underneath the person to show through and nothing under the type to
   * collide with. That poster has no `band` — its footer is part of the artwork.
   */
  ctx.drawImage(artwork, 0, 0, W, H)

  /*
   * A poster published from the admin panel has no footer of its own, because
   * what was uploaded is a plain event image. One is drawn here so the name has
   * somewhere legible to sit whatever the artwork behind it looks like — light,
   * dark or busy. Drawn BEFORE the person, so the person stands in front of it
   * exactly as the 22A figure overlaps its bands.
   */
  if (poster.band) drawBand(ctx, poster.band, logo, W, H)

  if (person) coverInto(ctx, person, poster.photoSlot, W, H)

  drawFittedLine(ctx, name, poster.name, W, H)
  drawFittedLine(ctx, designation, poster.designation, W, H)

  return canvas
}

/**
 * The social card for a poster somebody has personalised.
 *
 * WHY A SEPARATE IMAGE FROM THE POSTER
 * The poster is 2048x2560 and about a megabyte. Crawlers want roughly 1.91:1
 * and a couple of hundred KB; handed the poster itself, WhatsApp renders no
 * preview at all and everything else crops it wherever it likes. So the card is
 * made deliberately rather than left to chance.
 *
 * WHY THE BOTTOM OF THE POSTER
 * A 1.91:1 slice off the bottom is not a compromise — it is the half that
 * carries everything personal. Measured against this artwork it contains the
 * date band, the yellow slogan band, the whole of the photo slot (which starts
 * at y 0.629, inside the slice's 0.580), and the name, designation and party
 * mark. The headline is the only thing lost, and og:title carries that in
 * words. Shrinking the entire poster into a letterbox instead would show the
 * person about forty pixels tall, which defeats the point of the card.
 *
 * WHY IN THE BROWSER
 * Two reasons, and the second is decisive. The cut-out person exists only here —
 * it is never uploaded. And this text is Telugu: the browser shapes it
 * correctly, whereas the Python that builds the static campaign cards runs on a
 * Pillow without raqm and would reorder the conjuncts.
 *
 * @param {object}            opts
 * @param {HTMLCanvasElement} opts.canvas  destination, resized in place
 * @param {CanvasImageSource} opts.source  the finished poster canvas
 * @param {number=}           opts.width
 * @param {number=}           opts.height
 */
export function renderShareCard({ canvas, source, width = 1200, height = 630, fromTop = false }) {
  canvas.width = width
  canvas.height = height

  const sw = source.width
  const sh = source.height
  // The tallest bottom-anchored slice of the poster that has the card's aspect.
  let cropH = Math.round(sw * (height / width))
  let cropW = sw
  if (cropH > sh) {
    // A poster wider than the card's aspect: centre-crop instead of running off
    // the top. Not reachable with the current artwork, but a poster added later
    // should not silently produce a broken card.
    cropH = sh
    cropW = Math.round(sh * (width / height))
  }
  const sx = Math.round((sw - cropW) / 2)
  /*
   * Bottom by default, top on request — and which one is right depends entirely
   * on what the card is for.
   *
   * A card for somebody's OWN poster takes the bottom, because that is where
   * their face and their name are and that is the whole point of it. A card for
   * the CAMPAIGN takes the top, because that is where the event image says what
   * the campaign is about; the bottom would show an empty name band and a photo
   * slot nobody has filled in yet.
   */
  const sy = fromTop ? 0 : sh - cropH

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, width, height)
  return canvas
}

/** Canvas -> JPEG Blob. JPEG, not PNG: a 1600x2000 PNG of a photographic poster
 *  runs to several megabytes, which is painful to share on a phone. */
export function canvasToJpeg(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the poster.'))),
      'image/jpeg',
      quality
    )
  })
}
