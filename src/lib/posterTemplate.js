/**
 * The layout applied to a campaign poster published from the admin panel.
 *
 * WHY A TEMPLATE RATHER THAN MEASUREMENT
 * The 22A poster's geometry was measured off the artwork itself — a script found
 * the designer's white silhouette and read the extents of the baked-in type, and
 * every number in that entry came from pixels. That works because a designer
 * drew a slot and left it there to be found.
 *
 * Artwork uploaded from the admin panel has no slot. It is a plain event image:
 * no silhouette, no name band, nothing reserved. There is no honest way to guess
 * where a person "should" go on an arbitrary picture, and guessing wrong means a
 * face over the headline on material that goes out under his name.
 *
 * So nothing is guessed. The furniture is DRAWN: a brand band across the foot
 * carrying the party mark, the name and the designation, with the cut-out person
 * standing at the right. The artwork fills the frame behind it. That gives a
 * legible, predictable result on any image somebody uploads, and it keeps every
 * campaign looking like it came from the same office — which for party material
 * matters more than bespoke composition per event.
 *
 * The split follows the 22A poster deliberately: type on the left, person on the
 * right, party mark bottom-left. Somebody who has seen one will recognise the
 * other.
 */

/** Every poster is 4:5 at this size, which is what the phone galleries and
 *  WhatsApp want, and what the existing artwork already is. */
export const POSTER_W = 2048
export const POSTER_H = 2560

/**
 * The geometry written into a published poster's manifest entry.
 *
 * Returned rather than hardcoded so a future template revision can be versioned:
 * posters already published keep the numbers they were published with, and only
 * new ones pick up the change. Baking the current template into every entry is
 * what makes that possible.
 */
export function templateGeometry() {
  return {
    /*
     * The band we draw, because the artwork has none.
     *
     * A fifth of the height: enough for a name at a size that survives being
     * viewed as a WhatsApp thumbnail, without eating the event image. The accent
     * rule along its top edge is what stops it reading as a crop rather than a
     * designed footer.
     */
    band: {
      y: 0.8,
      color: '#0E0E0E',
      accent: '#F2D024',
      accentH: 0.006,
      logo: { x: 0.045, w: 0.105 },
    },

    /*
     * The person, bottom-right, fitted to CONTAIN this box.
     *
     * Starts at 0.60 so it can never reach the type, which is capped at 0.42
     * wide from x 0.175 — that is 0.595 at the very most, and only for a name
     * long enough to hit the cap. The slot runs to the foot of the poster so a
     * head-and-shoulders crop stands on the base rather than floating.
     */
    photoSlot: { x: 0.6, y: 0.34, w: 0.4, h: 0.66, anchor: 'bottom' },

    /*
     * Name and designation, sharing the band with the party mark.
     *
     * The pair is positioned so the BLOCK centres on the band's middle rather
     * than either baseline sitting there — the same correction the 22A poster
     * needed, for the same reason. 0.030 between baselines against a 0.026 name
     * is about 77px on 67px type: Telugu vowel marks reach well above and below
     * the Latin baseline and anything tighter runs them together.
     */
    name: {
      x: 0.175,
      y: 0.8783,
      maxW: 0.42,
      size: 0.026,
      weight: 700,
      color: '#FFFFFF',
      align: 'left',
      baseline: 'alphabetic',
    },
    designation: {
      x: 0.175,
      y: 0.9083,
      maxW: 0.42,
      size: 0.018,
      weight: 500,
      color: '#F2D024',
      align: 'left',
      baseline: 'alphabetic',
    },
  }
}

/** Bumped when the template changes shape. Stored on each published poster so
 *  an old one keeps rendering the way it was published. */
export const TEMPLATE_VERSION = 2

/** Where the drawn band starts. Artwork below this is covered by it, so only
 *  what sits above it can be obscured by the person. */
const BAND_Y = 0.8

/**
 * How much is going on in each part of the image.
 *
 * Gradient magnitude on a downscaled copy. Headlines, faces and detailed
 * artwork have busy neighbourhoods; sky, flat colour and gradients do not. It
 * is a crude proxy for "something is here that matters" and it does not need to
 * be better than that — the job is only to rank a handful of candidate
 * rectangles against each other, not to understand the picture.
 *
 * Downscaled first because that is also a low-pass: photographic noise stops
 * registering as detail, while a line of Telugu text still does.
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
      const dx = lum[i + 1] - lum[i - 1]
      const dy = lum[i + gw] - lum[i - gw]
      e[i] = Math.hypot(dx, dy)
    }
  }
  return { e, gw, gh }
}

/** Summed-area table, so a rectangle's mean is four lookups however big it is. */
function integralOf(e, gw, gh) {
  const s = new Float64Array((gw + 1) * (gh + 1))
  for (let y = 0; y < gh; y += 1) {
    let row = 0
    for (let x = 0; x < gw; x += 1) {
      row += e[y * gw + x]
      s[(y + 1) * (gw + 1) + (x + 1)] = s[y * (gw + 1) + (x + 1)] + row
    }
  }
  return s
}

/**
 * Work out where the person and the type should go on THIS artwork.
 *
 * The template used to put the person bottom-right on every poster, which is
 * right until somebody uploads an image with its headline on the right — and
 * then a face lands on the words, on material going out under his name.
 *
 * So the image is asked. Candidate slots are scored on how much detail they
 * would cover, and the quietest wins. The type and the party mark then go to
 * the OPPOSITE side, which is what actually guarantees they never collide: they
 * are placed relative to the person rather than both being pinned to fixed
 * coordinates and hoped over.
 *
 * Only the part of a slot ABOVE the band is scored. Below it the drawn band
 * covers the artwork completely, so whatever is down there is hidden anyway and
 * counting it would bias every choice by the same irrelevant amount.
 *
 * Ties go to the larger slot. A bigger figure is a better poster, so size wins
 * whenever it costs nothing.
 */
export function chooseLayout(img) {
  const { e, gw, gh } = energyMap(img)
  const sum = integralOf(e, gw, gh)

  const meanEnergy = (fx, fy, fw, fh) => {
    const x0 = Math.max(0, Math.round(fx * gw))
    const y0 = Math.max(0, Math.round(fy * gh))
    const x1 = Math.min(gw, Math.round((fx + fw) * gw))
    const y1 = Math.min(gh, Math.round((fy + fh) * gh))
    const n = (x1 - x0) * (y1 - y0)
    if (n <= 0) return 0
    const W = gw + 1
    const total =
      sum[y1 * W + x1] - sum[y0 * W + x1] - sum[y1 * W + x0] + sum[y0 * W + x0]
    return total / n
  }

  const SHAPES = [
    { w: 0.4, y: 0.34 },
    { w: 0.36, y: 0.42 },
    { w: 0.32, y: 0.5 },
  ]

  let best = null
  for (const side of ['right', 'left']) {
    for (const shape of SHAPES) {
      const x = side === 'right' ? 1 - shape.w : 0
      const busy = meanEnergy(x, shape.y, shape.w, BAND_Y - shape.y)
      // A gentle bonus for area, small enough that it only breaks near-ties.
      const score = busy - shape.w * 0.02
      if (!best || score < best.score) best = { side, x, ...shape, score, busy }
    }
  }

  const LOGO_W = 0.105
  const GAP = 0.03
  const EDGE = 0.045

  // Type and mark on the far side from the person, with the text box bounded by
  // whatever room is actually left rather than by a constant.
  let logoX
  let textX
  let textMaxW
  if (best.side === 'right') {
    logoX = EDGE
    textX = EDGE + LOGO_W + 0.025
    textMaxW = best.x - textX - GAP
  } else {
    logoX = 1 - EDGE - LOGO_W
    textX = best.w + GAP
    textMaxW = logoX - textX - 0.025
  }

  const geometry = templateGeometry()
  return {
    ...geometry,
    band: { ...geometry.band, logo: { x: logoX, w: LOGO_W } },
    photoSlot: { x: best.x, y: best.y, w: best.w, h: 1 - best.y, anchor: 'bottom' },
    name: { ...geometry.name, x: textX, maxW: Math.max(0.2, textMaxW) },
    designation: { ...geometry.designation, x: textX, maxW: Math.max(0.2, textMaxW) },
    // Kept so a published poster records why it looks the way it does, and so a
    // human can sanity-check the choice without re-running the analysis.
    layout: {
      side: best.side,
      busyness: Number(best.busy.toFixed(4)),
      chosenFrom: SHAPES.length * 2,
    },
  }
}

/**
 * URL-safe slug from a headline.
 *
 * Latin characters only, because the slug ends up in a URL that gets pasted into
 * WhatsApp and read aloud over the phone. A Telugu headline therefore needs the
 * English gloss to derive from — the admin form asks for one and falls back to
 * the date, rather than producing a slug of percent-escapes nobody can dictate.
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
