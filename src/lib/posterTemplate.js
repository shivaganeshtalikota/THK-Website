/**
 * The layout applied to a campaign poster published from the admin panel.
 *
 * TEMPLATE 3 — THE NAME BAR
 * Modelled on the posters the office actually circulates (the Vinayaka
 * Chavithi greeting was the reference): the event artwork fills the frame, a
 * solid bar runs across the foot carrying the name in heavy type with the
 * designation beneath it, the party mark sits on the bar as a tile that rises
 * a little above it, and the person stands ON the bar at one side — large,
 * because the person is the point of a personalised poster.
 *
 * Template 2 put the person in a box and fitted them to CONTAIN it, which with
 * a wide head-and-shoulders photo produced a figure a quarter of the height of
 * the poster. The office's verdict was that it looked small and generated.
 * Here the person is sized by HEIGHT against the poster, and only a width cap
 * stops a very wide photo from taking over.
 *
 * WHAT IS STORED
 * Every number and colour a poster renders with is written into its manifest
 * entry when it is published. A later change to a theme or a default moves
 * new posters only; one already circulating on WhatsApp keeps looking the way
 * it did the day it went out.
 */

/** Every poster is 4:5 at this size — what phone galleries and WhatsApp want. */
export const POSTER_W = 2048
export const POSTER_H = 2560

export const TEMPLATE_VERSION = 3

/**
 * Colour schemes for the bar and its type.
 *
 * `classic` follows the reference poster: white bar, red name, green
 * designation, a thin gold rule along the top edge. The others are there
 * because the right bar depends on the artwork above it — a white bar under a
 * pale temple photograph disappears, and a dark one under a night rally does.
 */
export const THEMES = {
  classic: {
    label: 'White bar — red and green',
    bar: '#FFFFFF',
    rule: '#E2B100',
    name: '#D0021B',
    designation: '#0B7A3B',
  },
  party: {
    label: 'Party yellow bar',
    bar: '#FFD400',
    rule: '#C8001A',
    name: '#C8001A',
    designation: '#141413',
  },
  night: {
    label: 'Dark bar — white and gold',
    bar: '#101010',
    rule: '#FFD400',
    name: '#FFFFFF',
    designation: '#FFD400',
  },
  maroon: {
    label: 'Maroon bar — white and gold',
    bar: '#7A0019',
    rule: '#FFD400',
    name: '#FFFFFF',
    designation: '#FFD400',
  },
}

export const PERSON_SIZES = {
  medium: { label: 'Medium', h: 0.42 },
  large: { label: 'Large', h: 0.47 },
  xl: { label: 'Extra large', h: 0.52 },
}

/** Where the bar starts, as a fraction of the height, when we draw it. */
export const BAR_Y = 0.872

/**
 * The geometry written into a published poster's manifest entry.
 *
 * @param {object} o
 * @param {keyof THEMES} o.theme
 * @param {'left'|'right'|'center'} o.side     where the person stands
 * @param {keyof PERSON_SIZES} o.size
 * @param {{y:number,color:string}|null} o.ownBar  an empty bar found in the
 *        artwork itself — used instead of painting one
 */
export function templateGeometry({ theme = 'classic', side = 'right', size = 'large', ownBar = null, layer = 'behind', showLogo = true } = {}) {
  const t = THEMES[theme] || THEMES.classic
  const personH = (PERSON_SIZES[size] || PERSON_SIZES.large).h
  const barY = ownBar ? ownBar.y : BAR_Y
  const barColor = ownBar ? ownBar.color : t.bar
  // Dark bar, light type; light bar, the theme's type. Decided on the bar
  // actually used, so an artwork's own dark bar never gets red-on-black text.
  const darkBar = luminance(barColor) < 0.35
  return {
    templateVersion: TEMPLATE_VERSION,
    theme,
    size,
    bar: {
      y: round4(barY),
      color: barColor,
      paint: !ownBar,
      rule: ownBar ? null : t.rule,
    },
    // show: false leaves the party mark off this poster.
    logo: { side: side === 'left' ? 'right' : 'left', w: 0.16, show: showLogo !== false },
    // layer: 'behind' — the bar covers the person's lower edge (the default);
    // 'front' — the person stands on the poster's bottom edge, over the bar.
    person: { side, h: personH, maxW: 0.6, top: 0.1, shadow: true, layer: layer === 'front' ? 'front' : 'behind' },
    name: {
      color: darkBar && !isLight(t.name) ? '#FFFFFF' : !darkBar && isLight(t.name) ? '#D0021B' : t.name,
      // The name leads: on the reference posters it is the biggest thing on
      // the bar. A long one still shrinks to fit the width.
      size: 0.058,
      weight: 800,
    },
    designation: {
      color:
        darkBar && !isLight(t.designation) ? '#FFD400' : !darkBar && isLight(t.designation) ? '#0B7A3B' : t.designation,
      size: 0.03,
      weight: 700,
    },
  }
}

const round4 = (n) => Math.round(n * 10000) / 10000

function hexRgb(hex) {
  const h = String(hex).replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

/** Relative luminance, 0 (black) .. 1 (white). */
export function luminance(hex) {
  const [r, g, b] = hexRgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const isLight = (hex) => luminance(hex) > 0.6

/* ------------------------------------------------------------------ */

/**
 * How much is going on in each part of the image.
 *
 * Gradient magnitude on a downscaled copy. Headlines, faces and detailed
 * artwork have busy neighbourhoods; sky, flat colour and gradients do not. It
 * only has to rank a couple of candidate areas against each other.
 */
function energyMap(img, gw = 96, gh = 120) {
  const c = document.createElement('canvas')
  c.width = gw
  c.height = gh
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, gw, gh)
  const px = ctx.getImageData(0, 0, gw, gh).data

  const lum = new Float32Array(gw * gh)
  for (let i = 0, j = 0; i < lum.length; i += 1, j += 4) {
    lum[i] = (px[j] * 0.299 + px[j + 1] * 0.587 + px[j + 2] * 0.114) / 255
  }
  const e = new Float32Array(gw * gh)
  for (let y = 1; y < gh - 1; y += 1) {
    for (let x = 1; x < gw - 1; x += 1) {
      const i = y * gw + x
      e[i] = Math.hypot(lum[i + 1] - lum[i - 1], lum[i + gw] - lum[i - gw])
    }
  }
  return { e, gw, gh }
}

function meanEnergy({ e, gw, gh }, fx, fy, fw, fh) {
  const x0 = Math.max(0, Math.round(fx * gw))
  const y0 = Math.max(0, Math.round(fy * gh))
  const x1 = Math.min(gw, Math.round((fx + fw) * gw))
  const y1 = Math.min(gh, Math.round((fy + fh) * gh))
  let s = 0
  let n = 0
  for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
    s += e[y * gw + x]
    n += 1
  }
  return n ? s / n : 0
}

/**
 * Which side the person should stand on, for THIS artwork.
 *
 * A face over the headline is the one mistake that cannot go out under his
 * name, so the image is asked: the half of the area above the bar with less
 * going on in it wins. The party mark and the type go to the other side, which
 * is what guarantees they never collide — they are placed relative to the
 * person rather than both pinned to fixed coordinates and hoped over.
 *
 * Right wins a near-tie: that is where the eye finishes reading a Telugu or
 * English line, and where the reference poster puts him.
 */
export function chooseSide(img, barY = BAR_Y) {
  const map = energyMap(img)
  const top = 0.38
  const left = meanEnergy(map, 0, top, 0.45, barY - top)
  const right = meanEnergy(map, 0.55, top, 0.45, barY - top)
  return {
    side: left < right * 0.85 ? 'left' : 'right',
    busyness: { left: Number(left.toFixed(4)), right: Number(right.toFixed(4)) },
  }
}

/**
 * Look for an empty bar the designer already left at the foot of the artwork.
 *
 * Plenty of event posters arrive with a plain strip along the bottom meant for
 * exactly this — a name. Painting a second bar over it wastes the design and
 * usually does not quite line up. So the bottom rows are read: a run of rows
 * that are all close to one colour, at least 6% of the height tall, counts as
 * a bar, and its top edge and colour are handed back.
 *
 * Returns {y, color} as fractions / hex, or null.
 */
export function detectOwnBar(canvas) {
  const W = 256
  const H = Math.round((canvas.height / canvas.width) * W)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(canvas, 0, 0, W, H)
  const px = ctx.getImageData(0, 0, W, H).data

  // Reference colour: the median-ish of the very bottom row's centre.
  const ref = rowStats(px, W, H - 2)
  if (!ref.uniform) return null
  let top = H - 2
  for (let y = H - 3; y > H * 0.6; y -= 1) {
    const s = rowStats(px, W, y)
    if (!s.uniform || colourDistance(s.mean, ref.mean) > 18) break
    top = y
  }
  const frac = (H - top) / H
  if (frac < 0.06 || frac > 0.3) return null
  const hex = `#${ref.mean.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`
  return { y: top / H, color: hex }
}

function rowStats(px, W, y) {
  const mean = [0, 0, 0]
  const x0 = Math.round(W * 0.04)
  const x1 = Math.round(W * 0.96)
  for (let x = x0; x < x1; x += 1) {
    const j = (y * W + x) * 4
    mean[0] += px[j]
    mean[1] += px[j + 1]
    mean[2] += px[j + 2]
  }
  const n = x1 - x0
  mean[0] /= n
  mean[1] /= n
  mean[2] /= n
  let off = 0
  for (let x = x0; x < x1; x += 1) {
    const j = (y * W + x) * 4
    if (colourDistance([px[j], px[j + 1], px[j + 2]], mean) > 26) off += 1
  }
  return { mean, uniform: off / n < 0.03 }
}

const colourDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * Compose an uploaded event image into the 4:5 poster frame.
 *
 * 'full'      the artwork covers the whole frame (right for artwork that is
 *             already about 4:5, which is most designed posters)
 * 'above-bar' the artwork is fitted, whole, into the area above the bar, so a
 *             square greeting or a landscape photograph loses nothing under it
 *
 * Wherever the artwork does not reach, a blurred, darkened copy of itself
 * fills in — it carries the image's own colours, so it reads as a deliberate
 * backdrop rather than as letterboxing.
 */
export function composeArtwork(img, fit = 'auto', barY = BAR_Y) {
  const W = POSTER_W
  const H = POSTER_H
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#0E0E0E'
  ctx.fillRect(0, 0, W, H)

  const aspect = img.width / img.height
  const mode = fit === 'auto' ? (Math.abs(aspect - W / H) / (W / H) < 0.04 ? 'full' : 'above-bar') : fit

  const cover = Math.max(W / img.width, H / img.height)
  ctx.save()
  ctx.filter = 'blur(60px) brightness(0.55) saturate(1.1)'
  ctx.drawImage(img, (W - img.width * cover) / 2, (H - img.height * cover) / 2, img.width * cover, img.height * cover)
  ctx.restore()

  if (mode === 'full') {
    // Cover, centred: for ~4:5 artwork this crops a sliver at most.
    ctx.drawImage(img, (W - img.width * cover) / 2, (H - img.height * cover) / 2, img.width * cover, img.height * cover)
  } else {
    const areaH = barY * H
    const s = Math.min(W / img.width, areaH / img.height)
    const w = img.width * s
    const h = img.height * s
    ctx.drawImage(img, (W - w) / 2, (areaH - h) / 2, w, h)
  }
  return { canvas, mode }
}

/**
 * URL-safe slug from a headline. Latin only: the slug ends up in a link that
 * gets pasted into WhatsApp and read aloud over the phone.
 */
export function slugify(text, fallback = 'campaign') {
  const base = String(text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')
  return base || fallback
}
