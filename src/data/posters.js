/**
 * The poster campaigns a supporter can personalise.
 *
 * HOW TO ADD A POSTER
 * Drop the artwork in public/posters/<slug>.jpg, add an entry here, and the
 * listing page, the editor and the sitemap all pick it up. Nothing else needs
 * touching — that is the whole point of this file.
 *
 * WHY THE GEOMETRY IS FRACTIONAL
 * Every coordinate below is a fraction of the artwork's own width or height,
 * never a pixel. The same numbers then hold whether the artwork is 1080px wide
 * or 2000px, and whether we are drawing a small on-screen preview or the
 * full-resolution download. Pixel coordinates would have to be re-measured for
 * every export size, and would silently drift the moment anyone re-exported the
 * artwork at a different scale.
 *
 * `photoSlot` is where the cut-out person is drawn. It is the area the artwork
 * leaves as a white silhouette. The person is fitted to COVER that box and
 * anchored at the bottom, because a portrait cropped at the shoulders should sit
 * on the baseline of the slot rather than float in the middle of it.
 */

/**
 * @typedef {object} Poster
 * @property {string} slug        URL segment, and the artwork filename.
 * @property {string} title       Telugu headline, as it appears on the artwork.
 * @property {string} titleEn     Plain-English gloss, for the listing and alt text.
 * @property {string} summary     What the poster is about, in one sentence.
 * @property {string} issue       Short tag, e.g. "22A".
 * @property {number} width       Artwork pixel width.
 * @property {number} height      Artwork pixel height.
 */

export const posters = [
  {
    slug: '22a-patta-bhumi',
    title: 'పట్టా భూమికి తాళం! 22A పేరుతో గందరగోళం!',
    titleEn: 'A lock on patta land — the confusion created in the name of 22A',
    summary:
      'Farmers holding valid patta land are finding their titles flagged under Section 22A and their registrations blocked. The poster carries the date of the protest and the party’s stand alongside it.',
    issue: '22A',
    date: '16 September 2026',
    /*
     * Bump when the artwork file changes.
     *
     * /posters/* is served immutable for a year, which is right for a file
     * that never changes and wrong for one that does — a corrected artwork
     * was cached indefinitely by every browser that had seen the old one,
     * and no amount of rebuilding dislodged it. The version goes in the
     * filename so a new artwork is a new URL.
     */
    version: 2,

    /*
     * Artwork size, and every box below, MEASURED from the file rather than
     * eyeballed — scripts read the pixels, found the white silhouette and the
     * baked-in placeholder type, and these are the numbers that came back.
     * Guessing them produces a poster that is subtly wrong in a way nobody
     * notices until it has been shared a thousand times.
     */
    width: 2048,
    height: 2560,

    /*
     * Where the cut-out person is drawn.
     *
     * The artwork SHIPPED with a white person-shaped placeholder here. It is
     * gone — painted out in preprocessing — because drawing a cut-out on top of
     * it left white showing everywhere the two outlines disagreed: around the
     * shoulders, between arm and body, above the head. No runtime trick fixes
     * that; the placeholder simply had to stop existing.
     *
     * The slot keeps the placeholder's position so the composition still reads
     * as designed, and stops at x 0.615 — comfortably right of where the name
     * can reach (0.585), so the photograph never crowds the type.
     */
    photoSlot: { x: 0.615, y: 0.585, w: 0.385, h: 0.415, anchor: 'bottom' },

    /*
     * Name above, designation below, the pair centred on the party mark.
     *
     * The mark's tile was measured at y 0.9062..0.9816, centre 0.9439, right
     * edge x 0.1519. The two lines straddle that centre so the block reads as
     * one unit with the logo rather than sitting under it, and they start at
     * x 0.185 — just clear of the tile.
     *
     * The artwork's own "Leader's Name, Designation" is not painted over at
     * runtime any more; it was removed from the artwork itself, which is one
     * fewer thing to go wrong on every frame.
     */
    name: {
      x: 0.185,
      y: 0.9406,
      maxW: 0.40,
      size: 0.026,
      weight: 700,
      color: '#FFFFFF',
      align: 'left',
      baseline: 'alphabetic',
    },
    designation: {
      x: 0.185,
      y: 0.9602,
      maxW: 0.40,
      size: 0.018,
      weight: 500,
      color: '#F2D024',
      align: 'left',
      baseline: 'alphabetic',
    },
  },
]

export const posterBySlug = (slug) => posters.find((p) => p.slug === slug) ?? null

/** Artwork path for a poster. Served from /public, so same-origin — which is
 *  what keeps the export canvas untainted and toBlob() legal. */
export const posterImage = (poster) => `/posters/${poster.slug}-v${poster.version}.jpg`
