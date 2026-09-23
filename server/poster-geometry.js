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

export function sanitizeGeometry(g) {
  if (!g || typeof g !== 'object') throw new Invalid('The layout was missing. Reload the panel and try again.')
  if (Number(g.templateVersion) !== 3) throw new Invalid('This layout is from an older version of the panel. Reload it.')
  return {
    templateVersion: 3,
    theme: pick(g.theme, ['classic', 'party', 'night', 'maroon'], 'classic'),
    size: pick(g.size, ['medium', 'large', 'xl'], 'large'),
    bar: {
      y: num(g.bar?.y, 0.7, 0.94, 'the bar position'),
      color: colour(g.bar?.color, '#FFFFFF'),
      paint: g.bar?.paint !== false,
      rule: g.bar?.rule ? colour(g.bar.rule, null) : null,
    },
    logo: {
      side: pick(g.logo?.side, ['left', 'right'], 'left'),
      w: num(g.logo?.w, 0.08, 0.22, 'the logo size'),
    },
    person: {
      side: pick(g.person?.side, ['left', 'right', 'center'], 'right'),
      h: num(g.person?.h, 0.25, 0.6, 'the photo size'),
      maxW: num(g.person?.maxW, 0.3, 0.75, 'the photo width'),
      top: num(g.person?.top ?? 0.1, 0, 0.4, 'the photo limit'),
      shadow: g.person?.shadow !== false,
    },
    name: {
      color: colour(g.name?.color, '#D0021B'),
      size: num(g.name?.size, 0.02, 0.08, 'the name size'),
      weight: 800,
    },
    designation: {
      color: colour(g.designation?.color, '#0B7A3B'),
      size: num(g.designation?.size, 0.012, 0.05, 'the designation size'),
      weight: 700,
    },
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
