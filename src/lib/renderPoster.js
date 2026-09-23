/**
 * Draws a finished poster onto a canvas: artwork, cut-out person, name bar.
 *
 * Pure and synchronous once its inputs are loaded, so the same function renders
 * the on-screen preview, the full-resolution download and the image the share
 * link shows. Drawing those through different code paths is how a poster ends
 * up right on screen and wrong in the file.
 *
 * TAINTING. Everything drawn here is same-origin (/posters/*.jpg, /tdp-logo.png)
 * or a blob:/canvas made from the visitor's own upload, so toBlob() stays legal.
 */

/** Load an <img> and resolve only once it has actually decoded. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.src = src
  })
}

/** The face every poster's name and designation are set in. See
 *  scripts/fetch-fonts.py for how it was chosen. */
const POSTER_FACE = '"Anek Telugu", "Noto Sans Telugu", Inter, system-ui, sans-serif'

/**
 * Make sure the poster face is loaded before any text is drawn.
 *
 * Canvas does not wait for webfonts: fillText with a face still downloading
 * silently uses a fallback, and the download is then set in the wrong type —
 * often one with no Telugu at all. Both subsets are asked for by giving
 * load() a sample containing both scripts.
 */
export async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  const sample = 'తెలుగు Aa'
  await Promise.all(
    [700, 800].map((w) => document.fonts.load(`${w} 64px "Anek Telugu"`, sample).catch(() => {})),
  )
  await document.fonts.ready
}

const font = (weight, px) => `${weight} ${Math.round(px)}px ${POSTER_FACE}`

/* ------------------------------------------------------------- text */

/** Height a line of text actually occupies, from its real glyph extents —
 *  Telugu vowel signs reach well above and below the Latin baseline. */
function extents(ctx, text) {
  const m = ctx.measureText(text)
  return {
    w: m.width,
    up: m.actualBoundingBoxAscent || 0,
    down: m.actualBoundingBoxDescent || 0,
  }
}

/**
 * Break a designation into at most two lines, as evenly as possible.
 *
 * Balanced rather than greedy: "iTDP Telangana State / President" looks like
 * a mistake, "iTDP Telangana / State President" looks set.
 */
function balancedLines(ctx, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean)
  if (ctx.measureText(text).width <= maxW || words.length < 2) return [text]
  let best = null
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const worst = Math.max(ctx.measureText(a).width, ctx.measureText(b).width)
    if (!best || worst < best.worst) best = { lines: [a, b], worst }
  }
  return best.lines
}

/** Truncate with an ellipsis to fit — only when shrinking has run out. */
function fitWithEllipsis(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1)
  return `${out}…`
}

/* ------------------------------------------------------------ person */

/**
 * Normalise what the studio hands in. A cut-out arrives as {canvas, cut};
 * a photograph whose background could not be removed arrives as a plain
 * image, which is a rectangle cut on every side.
 */
function asPerson(person) {
  if (!person) return null
  if (person.canvas) return { src: person.canvas, cut: person.cut || {}, face: person.face || null }
  return { src: person, cut: { left: true, right: true, top: true, bottom: true }, face: null }
}

/**
 * Stand a person on a bar: the placement for template 3, and for the 22A
 * poster, whose yellow slogan band plays the part of the bar.
 *
 * SIZED BY THE FACE when a face was found. Photos arrive at every framing —
 * a selfie that is mostly face, a full-length shot where the face is a speck —
 * and sizing the whole cut-out to a fixed height made the first enormous and
 * the second tiny. So the cut-out is first sized by height, then corrected so
 * the face lands within `faceRange` of the poster's height.
 *
 * STANDING ON THE BAR. The bottom meets the bar's top edge; a photo cut at the
 * chest tucks a little behind it. When the face-sized figure is taller than the
 * room above the bar, it starts at `minY` and the rest goes BEHIND the bar
 * (the caller draws the bar over it) rather than being shrunk back down — a
 * full-length photo becomes a waist-up figure the size of everybody else's.
 *
 * Horizontally, a side the photograph cuts through goes flush to the poster's
 * edge, where the poster itself ends the arm or shoulder naturally.
 */
function placeStanding(p, W, H, o) {
  const barTop = o.barTop * H
  const minY = o.minY * H
  const aspect = p.src.width / p.src.height
  let h = o.h * H
  if (p.face && p.face.h > 0.02) {
    const faceH = p.face.h * h
    const lo = o.faceRange[0] * H
    const hi = o.faceRange[1] * H
    if (faceH > hi) h *= hi / faceH
    else if (faceH < lo) h *= lo / faceH
  }
  let w = h * aspect
  const maxW = o.maxW * W
  if (w > maxW) {
    w = maxW
    h = w / aspect
  }
  const tuck = p.cut.bottom ? 0.012 * H : 0
  let y = barTop + tuck - h
  if (y < minY) {
    y = minY
    // Never let the bar cover the face itself.
    if (p.face) {
      const faceBottom = y + (p.face.y + p.face.h) * h
      const limit = barTop - 0.03 * H
      if (faceBottom > limit) {
        const s = (limit - y) / ((p.face.y + p.face.h) * h)
        h *= s
        w *= s
      }
    }
  }

  const margin = (o.margin ?? 0.03) * W
  let x
  if (o.side === 'left') x = p.cut.left ? 0 : margin
  else if (o.side === 'center') x = (W - w) / 2
  else x = p.cut.right ? W - w : W - w - margin

  return { x, y, w, h, below: y + h > barTop + 1 }
}

/** Draw the artwork again from `top` down, over whatever is there. */
function occludeBelow(ctx, artwork, top, W, H) {
  const sy = (top / H) * artwork.height
  ctx.drawImage(artwork, 0, sy, artwork.width, artwork.height - sy, 0, top, W, H - top)
}

/** Template 3's own numbers for placeStanding. */
const standingFor = (g) => ({
  barTop: g.bar.y,
  minY: g.person.top ?? 0.1,
  h: g.person.h,
  maxW: g.person.maxW,
  side: g.person.side,
  // A face between a tenth and a sixth of the poster's height: big enough to
  // be the subject, not so big that a selfie swamps the artwork.
  faceRange: [0.1, 0.17],
})

/** Legacy placement (templates 1–2 and the hand-measured 22A poster):
 *  contained in a box, anchored at its foot. */
function placeInSlot(slot, p, W, H) {
  const bx = slot.x * W
  const by = slot.y * H
  const bw = slot.w * W
  const bh = slot.h * H
  const s = Math.min(bw / p.src.width, bh / p.src.height)
  const w = p.src.width * s
  const h = p.src.height * s
  // A side the photo cuts through goes flush to that side of the slot.
  let x = bx + (bw - w) / 2
  if (p.cut.right && !p.cut.left) x = bx + bw - w
  if (p.cut.left && !p.cut.right) x = bx
  const y = slot.anchor === 'bottom' ? by + bh - h : by + (bh - h) / 2
  return { x, y, w, h, clip: { x: bx, y: by, w: bw, h: bh } }
}

const EASE = [0, 0.028, 0.104, 0.216, 0.352, 0.5, 0.648, 0.784, 0.896, 0.972, 1]

/**
 * Fade ONLY where the photograph itself was cut and that cut is now visible.
 *
 * The subject's own outline is never softened: where the matte found hair or
 * a shoulder, that edge is the edge. What gets faded is the straight line
 * where the camera's frame sliced through an arm or a shoulder — and only if
 * that line lands inside the poster. A cut that sits on the poster's own edge,
 * or behind the bar, is already natural and is left alone.
 */
function drawPersonWithCuts(ctx, p, box, W, H, { shadow, hiddenBottom }) {
  const w = Math.max(1, Math.round(box.w))
  const h = Math.max(1, Math.round(box.h))
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const o = off.getContext('2d')
  o.imageSmoothingEnabled = true
  o.imageSmoothingQuality = 'high'
  o.drawImage(p.src, 0, 0, w, h)

  const exposed = {
    left: p.cut.left && box.x > 1,
    right: p.cut.right && box.x + box.w < W - 1,
    top: p.cut.top && box.y > 1,
    bottom: p.cut.bottom && !hiddenBottom && box.y + box.h < H - 1,
  }
  const fade = (x0, y0, x1, y1) => {
    const g = o.createLinearGradient(x0, y0, x1, y1)
    EASE.forEach((a, i) => g.addColorStop(i / (EASE.length - 1), `rgba(0,0,0,${a})`))
    o.globalCompositeOperation = 'destination-in'
    o.fillStyle = g
    o.fillRect(0, 0, w, h)
    o.globalCompositeOperation = 'source-over'
  }
  const band = Math.round(w * 0.14)
  const vband = Math.round(h * 0.1)
  if (exposed.left) fade(0, 0, band, 0)
  if (exposed.right) fade(w, 0, w - band, 0)
  if (exposed.top) fade(0, 0, 0, vband)
  if (exposed.bottom) fade(0, h, 0, h - vband)

  ctx.save()
  if (box.clip) {
    ctx.beginPath()
    ctx.rect(box.clip.x, box.clip.y, box.clip.w, box.clip.h)
    ctx.clip()
  }
  if (shadow) {
    // Lifts the figure off busy artwork without the sticker-outline look.
    ctx.shadowColor = 'rgba(0,0,0,0.32)'
    ctx.shadowBlur = Math.round(W * 0.014)
    ctx.shadowOffsetY = Math.round(W * 0.003)
  }
  ctx.drawImage(off, Math.round(box.x), Math.round(box.y))
  ctx.restore()
}

/* -------------------------------------------------------- template 3 */

function logoBox(g, logo, W, H) {
  if (!logo) return null
  const w = g.logo.w * W
  const h = w * (logo.height / logo.width)
  const margin = 0.035 * W
  const x = g.logo.side === 'right' ? W - margin - w : margin
  // Bottom-aligned inside the bar; tall enough that the top rises above it.
  const y = H - 0.022 * H - h
  return { x, y, w, h }
}

function drawBarText(ctx, g, name, designation, lb, W, H) {
  const barTop = g.bar.y * H
  const barH = H - barTop
  const margin = 0.035 * W
  const gap = 0.03 * W
  let x0 = margin
  let x1 = W - margin
  if (lb && g.logo.side === 'left') x0 = lb.x + lb.w + gap
  if (lb && g.logo.side === 'right') x1 = lb.x - gap
  const regionW = x1 - x0
  const cx = (x0 + x1) / 2

  let nameSize = g.name.size * H
  let desSize = g.designation.size * H

  // Name: shrink to fit, down to 60%; only then truncate.
  ctx.font = font(g.name.weight, nameSize)
  while (name && ctx.measureText(name).width > regionW && nameSize > g.name.size * H * 0.6) {
    nameSize -= 2
    ctx.font = font(g.name.weight, nameSize)
  }
  const nameText = name ? fitWithEllipsis(ctx, name, regionW) : ''

  // Designation: two balanced lines before any shrinking.
  ctx.font = font(g.designation.weight, desSize)
  let lines = designation ? balancedLines(ctx, designation, regionW) : []
  while (lines.some((l) => ctx.measureText(l).width > regionW) && desSize > g.designation.size * H * 0.6) {
    desSize -= 2
    ctx.font = font(g.designation.weight, desSize)
    lines = balancedLines(ctx, designation, regionW)
  }
  lines = lines.map((l) => fitWithEllipsis(ctx, l, regionW))

  // Stack by real glyph extents and centre the block in the bar.
  const measure = () => {
    const items = []
    if (nameText) {
      ctx.font = font(g.name.weight, nameSize)
      items.push({ text: nameText, f: font(g.name.weight, nameSize), color: g.name.color, ...extents(ctx, nameText), gapAfter: desSize * 0.34 })
    }
    ctx.font = font(g.designation.weight, desSize)
    lines.forEach((l) => items.push({ text: l, f: font(g.designation.weight, desSize), color: g.designation.color, ...extents(ctx, l), gapAfter: desSize * 0.22 }))
    // Use a consistent line box for Telugu and Latin alike so two posters with
    // different scripts sit at the same height.
    items.forEach((it) => {
      const px = parseInt(it.f.match(/(\d+)px/)[1], 10)
      it.up = Math.max(it.up, px * 0.72)
      it.down = Math.max(it.down, px * 0.2)
    })
    const total = items.reduce((s, it, i) => s + it.up + it.down + (i < items.length - 1 ? it.gapAfter : 0), 0)
    return { items, total }
  }
  let { items, total } = measure()
  /*
   * Too tall for the bar: the DESIGNATION gives way first, down to 72% of its
   * size, and only then does everything shrink together. The name is what the
   * poster is for — on the reference posters it is the biggest thing on the
   * bar — so a long, two-line designation must not be the reason it ends up
   * small.
   */
  const room = barH * 0.86
  while (total > room && desSize > g.designation.size * H * 0.72) {
    desSize -= 2
    ;({ items, total } = measure())
  }
  if (total > room) {
    const s = room / total
    nameSize *= s
    desSize *= s
    ;({ items, total } = measure())
  }

  let y = barTop + (barH - total) / 2
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  items.forEach((it) => {
    ctx.font = it.f
    ctx.fillStyle = it.color
    ctx.fillText(it.text, cx, y + it.up)
    y += it.up + it.down + it.gapAfter
  })
  ctx.restore()
}

function renderTemplate3(ctx, poster, artwork, person, name, designation, logo, W, H) {
  const g = poster
  const barTop = g.bar.y * H
  const p = asPerson(person)

  // 1. The person, before the bar, so a chest-level cut tucks behind it.
  if (p) {
    const box = placeStanding(p, W, H, standingFor(g))
    drawPersonWithCuts(ctx, p, box, W, H, { shadow: g.person.shadow !== false, hiddenBottom: p.cut.bottom || box.below })
  }

  // 2. The bar, with a soft shadow above it and a thin rule along its top.
  if (g.bar.paint !== false) {
    const lift = ctx.createLinearGradient(0, barTop - 0.014 * H, 0, barTop)
    lift.addColorStop(0, 'rgba(0,0,0,0)')
    lift.addColorStop(1, 'rgba(0,0,0,0.22)')
    ctx.fillStyle = lift
    ctx.fillRect(0, barTop - 0.014 * H, W, 0.014 * H)
    ctx.fillStyle = g.bar.color
    ctx.fillRect(0, barTop, W, H - barTop)
    if (g.bar.rule) {
      ctx.fillStyle = g.bar.rule
      ctx.fillRect(0, barTop, W, Math.max(3, 0.005 * H))
    }
  } else if (p) {
    // The artwork's own bar: drawn again from the artwork, over the person, so
    // whatever of them reaches below its top edge is behind it — exactly as
    // with a bar we paint ourselves.
    occludeBelow(ctx, artwork, barTop, W, H)
  }

  // 3. The party mark, as a tile standing on the bar and rising above it.
  const lb = logoBox(g, logo, W, H)
  if (lb) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = Math.round(W * 0.012)
    ctx.shadowOffsetY = Math.round(W * 0.003)
    ctx.drawImage(logo, lb.x, lb.y, lb.w, lb.h)
    ctx.restore()
  }

  // 4. Name and designation, centred in the room the mark leaves.
  drawBarText(ctx, g, name, designation, lb, W, H)
}

/* ------------------------------------------------- legacy templates */

function drawLegacyLine(ctx, text, box, W, H) {
  if (!text) return
  const maxW = box.maxW * W
  let px = box.size * H
  const floor = px * 0.55
  // Heavier than the template asked for: the office wanted the name and the
  // role bold, and at 500 the designation read as a caption.
  const weight = Math.max(700, box.weight || 700)
  ctx.textAlign = box.align || 'left'
  ctx.textBaseline = box.baseline || 'alphabetic'
  ctx.fillStyle = box.color
  ctx.font = font(weight, px)
  while (ctx.measureText(text).width > maxW && px > floor) {
    px -= 1
    ctx.font = font(weight, px)
  }
  const out = fitWithEllipsis(ctx, text, maxW)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = Math.max(2, H * 0.002)
  ctx.fillText(out, box.x * W, box.y * H)
  ctx.restore()
}

function drawLegacyBand(ctx, band, logo, W, H) {
  const top = band.y * H
  ctx.save()
  ctx.fillStyle = band.color || '#0E0E0E'
  ctx.fillRect(0, top, W, H - top)
  if (band.accent) {
    ctx.fillStyle = band.accent
    ctx.fillRect(0, top, W, Math.max(2, (band.accentH || 0.005) * H))
  }
  if (logo && band.logo) {
    const w = band.logo.w * W
    const h = logo.height * (w / logo.width)
    ctx.drawImage(logo, band.logo.x * W, top + (H - top - h) / 2, w, h)
  }
  ctx.restore()
}

/* ------------------------------------------------------------ public */

/**
 * Compose the whole poster.
 *
 * @param {object}            opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {object}            opts.poster       entry from src/data/posters.js
 * @param {CanvasImageSource} opts.artwork      the base artwork, loaded
 * @param {object|CanvasImageSource=} opts.person  {canvas, cut} from
 *        removeBackground, or a plain image if the cut-out failed
 * @param {string}            opts.name
 * @param {string}            opts.designation
 * @param {CanvasImageSource=} opts.logo        the party mark
 * @param {number=}           opts.scale        1 = full artwork resolution
 */
export function renderPoster({ canvas, poster, artwork, person, name, designation, logo, scale = 1 }) {
  const W = Math.round(poster.width * scale)
  const H = Math.round(poster.height * scale)
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(artwork, 0, 0, W, H)

  const nm = String(name || '').trim()
  const ds = String(designation || '').trim()

  if (poster.templateVersion >= 3) {
    renderTemplate3(ctx, poster, artwork, person, nm, ds, logo, W, H)
    return canvas
  }

  // Templates 1–2 and the hand-measured built-in poster.
  if (poster.band) drawLegacyBand(ctx, poster.band, logo, W, H)
  const p = asPerson(person)
  if (p && poster.photoSlot?.mode === 'bar') {
    /*
     * The 22A poster: the person stands behind the yellow slogan band. The
     * band is drawn again from the artwork on top of them, so their lower
     * body disappears behind its straight top edge — the way a person stands
     * behind a banner — and nothing about the person is clipped or faded to
     * keep them off the slogan.
     */
    const slot = poster.photoSlot
    const box = placeStanding(p, W, H, slot)
    drawPersonWithCuts(ctx, p, box, W, H, { shadow: true, hiddenBottom: true })
    occludeBelow(ctx, artwork, slot.barTop * H, W, H)
  } else if (p && poster.photoSlot) {
    const box = placeInSlot(poster.photoSlot, p, W, H)
    const slotFoot = (poster.photoSlot.y + poster.photoSlot.h) * H
    drawPersonWithCuts(ctx, p, box, W, H, { shadow: false, hiddenBottom: slotFoot >= H - 1 })
  }
  drawLegacyLine(ctx, nm, poster.name, W, H)
  drawLegacyLine(ctx, ds, poster.designation, W, H)
  return canvas
}

/**
 * The link-preview card for a poster somebody has made: 1200x630.
 *
 * The WHOLE poster, standing in the middle of a blurred, darkened copy of
 * itself. An earlier card sliced a strip off the bottom, which put the name
 * and designation front and centre in every WhatsApp preview — the office
 * wanted the poster itself to be what people see, so that is what it shows.
 *
 * `fromTop` keeps the older behaviour for a CAMPAIGN's own card, where the
 * top of the artwork (the headline) is the right thing to show.
 */
export function renderShareCard({ canvas, source, width = 1200, height = 630, fromTop = false }) {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const sw = source.width
  const sh = source.height

  if (fromTop) {
    let cropH = Math.round(sw * (height / width))
    let cropW = sw
    if (cropH > sh) {
      cropH = sh
      cropW = Math.round(sh * (width / height))
    }
    ctx.drawImage(source, Math.round((sw - cropW) / 2), 0, cropW, cropH, 0, 0, width, height)
    return canvas
  }

  const cover = Math.max(width / sw, height / sh)
  ctx.save()
  ctx.filter = 'blur(24px) brightness(0.5) saturate(1.15)'
  ctx.drawImage(source, (width - sw * cover) / 2, (height - sh * cover) / 2, sw * cover, sh * cover)
  ctx.restore()

  const h = height * 0.94
  const w = h * (sw / sh)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 28
  ctx.drawImage(source, (width - w) / 2, (height - h) / 2, w, h)
  ctx.restore()
  return canvas
}

/** Canvas -> JPEG Blob. */
export function canvasToJpeg(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the poster.'))),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * The best-quality JPEG that fits under a byte ceiling.
 *
 * Starts high and steps down only as far as it has to — a quiet poster ships
 * at 0.93, a very busy one might need 0.85. Never below `floor`.
 */
export async function canvasToJpegUnder(canvas, maxBytes, { start = 0.93, floor = 0.72 } = {}) {
  let q = start
  let blob = await canvasToJpeg(canvas, q)
  while (blob.size > maxBytes && q > floor) {
    q = Math.max(floor, q - 0.05)
    blob = await canvasToJpeg(canvas, q)
  }
  return blob
}
