/**
 * Validate the layout the admin panel sends with a new or edited poster.
 *
 * The browser works the layout out (it is the only place that can look at
 * the artwork and shape Telugu), but the server decides what gets committed.
 * So the geometry is rebuilt here field by field from a whitelist: numbers
 * are clamped into range, colours must be #RRGGBB, enums must be known, and
 * anything else in the payload is simply not copied. A tampered request can
 * at worst produce an odd-looking poster — never a manifest the site cannot
 * build.
 */

import { POSTER_FONTS } from '../src/lib/posterFonts.js'

const TE_FONTS = POSTER_FONTS.filter((f) => f.script === 'te').map((f) => f.id)
const EN_FONTS = POSTER_FONTS.filter((f) => f.script === 'en').map((f) => f.id)

class Invalid extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

const num = (v, lo, hi, label) => {
  const n = Number(v)
  if (!Number.isFinite(n)) throw new Invalid(`The layout is missing ${label}. Reload the panel and try again.`)
  return Math.round(Math.min(hi, Math.max(lo, n)) * 10000) / 10000
}
const colour = (v, fallback) => (/^#[0-9A-Fa-f]{6}$/.test(String(v)) ? String(v).toUpperCase() : fallback)
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)

const isBox = (b) => b && typeof b === 'object' && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(Number(b[k])))

/** A box of fractions, kept on the poster and at least `min` in each size. */
function box(b, min, label) {
  const w = num(b.w, min, 1, label)
  const h = num(b.h, min, 1, label)
  return {
    x: num(b.x, 0, 1 - w, label),
    y: num(b.y, 0, 1 - h, label),
    w,
    h,
  }
}

/** The fonts chosen for a line of text: only faces the site ships. */
function fontFrom(f) {
  if (!f || typeof f !== 'object') return null
  return { te: pick(f.te, TE_FONTS, 'anek'), en: pick(f.en, ['same', ...EN_FONTS], 'same') }
}

/** What the panel needs to show the text-style choices again when editing. */
function styleFrom(s) {
  if (!s || typeof s !== 'object') return null
  const line = (l = {}) => ({
    te: pick(l.te, TE_FONTS, 'anek'),
    en: pick(l.en, ['same', ...EN_FONTS], 'same'),
    scale: num(l.scale ?? 1, 0.5, 1.6, 'the text size'),
    color: l.color ? colour(l.color, null) : null,
  })
  return { name: line(s.name), designation: line(s.designation), align: pick(s.align, ['left', 'center', 'right'], 'center') }
}

/**
 * The bar: painted, the artwork's own, or none (the text straight on the
 * artwork). A layout from before the modes existed has only `paint`, and
 * means what it always meant.
 */
function barFrom(b = {}) {
  const paint = b.paint !== false
  const mode = pick(b.mode, ['paint', 'artwork', 'none'], paint ? 'paint' : 'artwork')
  const out = {
    y: num(b.y, 0.6, 0.96, 'the bar position'),
    color: colour(b.color, '#FFFFFF'),
    paint: mode === 'paint',
    mode,
    rule: mode === 'paint' && b.rule ? colour(b.rule, null) : null,
  }
  // The clear stretch of the artwork's own bar, beside a mark drawn on it.
  if (mode !== 'paint' && Number.isFinite(Number(b.x0)) && Number.isFinite(Number(b.x1))) {
    const x0 = num(b.x0, 0, 0.7, 'the bar')
    const x1 = num(b.x1, x0 + 0.3, 1, 'the bar')
    out.x0 = x0
    out.x1 = x1
  }
  return out
}

export function sanitizeGeometry(g) {
  if (!g || typeof g !== 'object') throw new Invalid('The layout was missing. Reload the panel and try again.')
  if (Number(g.templateVersion) !== 3) throw new Invalid('This layout is from an older version of the panel. Reload it.')
  return {
    templateVersion: 3,
    theme: pick(g.theme, ['classic', 'party', 'night', 'maroon'], 'classic'),
    size: pick(g.size, ['medium', 'large', 'xl'], 'large'),
    bar: barFrom(g.bar),
    logo: {
      side: pick(g.logo?.side, ['left', 'right'], 'left'),
      w: num(g.logo?.w, 0.08, 0.22, 'the logo size'),
      show: g.logo?.show !== false,
    },
    person: {
      side: pick(g.person?.side, ['left', 'right', 'center'], 'right'),
      h: num(g.person?.h, 0.25, 0.6, 'the photo size'),
      maxW: num(g.person?.maxW, 0.3, 0.75, 'the photo width'),
      top: num(g.person?.top ?? 0.1, 0, 0.4, 'the photo limit'),
      shadow: g.person?.shadow !== false,
      layer: pick(g.person?.layer, ['behind', 'front'], 'behind'),
    },
    name: {
      color: colour(g.name?.color, '#D0021B'),
      size: num(g.name?.size, 0.02, 0.12, 'the name size'),
      weight: 800,
      ...(fontFrom(g.name?.font) ? { font: fontFrom(g.name.font) } : {}),
    },
    designation: {
      color: colour(g.designation?.color, '#0B7A3B'),
      size: num(g.designation?.size, 0.012, 0.07, 'the designation size'),
      weight: 700,
      ...(fontFrom(g.designation?.font) ? { font: fontFrom(g.designation.font) } : {}),
    },
    ...(['left', 'right'].includes(g.textAlign) ? { textAlign: g.textAlign } : {}),
    ...(styleFrom(g.style) ? { style: styleFrom(g.style) } : {}),
    // Placed by hand in the panel (drag and resize). Optional: without them the
    // renderer places the photo and the name itself.
    ...(isBox(g.photoBox) ? { photoBox: box(g.photoBox, 0.08, 'the photo box') } : {}),
    ...(isBox(g.textBox) ? { textBox: box(g.textBox, 0.04, 'the name box') } : {}),
    ...(g.layout && typeof g.layout === 'object'
      ? {
          layout: {
            side: pick(g.layout.side, ['left', 'right', 'center'], 'right'),
            chosenBy: pick(g.layout.chosenBy, ['auto', 'office'], 'auto'),
            fit: pick(g.layout.fit, ['full', 'above-bar'], 'full'),
            ownBar: Boolean(g.layout.ownBar),
          },
        }
      : {}),
  }
}
