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
export const TEMPLATE_VERSION = 1

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
