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
 * Fit an image to COVER a box, anchored at its bottom edge.
 *
 * Cover rather than contain: the silhouette in the artwork is a filled shape, so
 * letterboxing a portrait inside it would leave the artwork's white showing
 * around the person and look like a mistake. Bottom-anchored because a
 * head-and-shoulders photo belongs sitting on the base of the slot — centring it
 * vertically floats the subject and crops the head.
 */
function coverInto(ctx, img, slot, W, H) {
  const bx = slot.x * W
  const by = slot.y * H
  const bw = slot.w * W
  const bh = slot.h * H

  const scale = Math.max(bw / img.width, bh / img.height)
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
  scale = 1,
}) {
  const W = Math.round(poster.width * scale)
  const H = Math.round(poster.height * scale)
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Artwork first, then the person over it, then type over both. The person
  // goes above the artwork because the silhouette is a placeholder to be
  // covered, not a mask to be filled.
  ctx.drawImage(artwork, 0, 0, W, H)

  /*
   * Cover the artwork's own placeholder type before writing ours.
   *
   * "Leader's Name, Designation" is baked into the artwork as pixels. Without
   * this rectangle our name is drawn on top of it and the two overlap into an
   * unreadable smear — visible immediately on screen, and unfixable once the
   * poster is out in the world. The fill colour is sampled from the band in the
   * artwork rather than assumed to be #000, because it is not.
   */
  if (poster.clearBox) {
    const c = poster.clearBox
    ctx.fillStyle = c.color
    ctx.fillRect(c.x * W, c.y * H, c.w * W, c.h * H)
  }

  if (person) coverInto(ctx, person, poster.photoSlot, W, H)

  drawFittedLine(ctx, name, poster.name, W, H)
  drawFittedLine(ctx, designation, poster.designation, W, H)

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
