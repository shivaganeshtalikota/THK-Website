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
     * Artwork size, and every box below, MEASURED from the file rather than
     * eyeballed — scripts read the pixels, found the white silhouette and the
     * baked-in placeholder type, and these are the numbers that came back.
     * Guessing them produces a poster that is subtly wrong in a way nobody
     * notices until it has been shared a thousand times.
     */
    width: 2048,
    height: 2560,

    /*
     * The white silhouette on the right. Measured at x 0.6235..0.9995,
     * y 0.6289..1.0 — it runs clean off the bottom edge of the artwork, which is
     * why the height takes the slot all the way to 1.0 rather than stopping
     * short at the foot band.
     */
    photoSlot: { x: 0.6235, y: 0.6289, w: 0.3760, h: 0.3711, anchor: 'bottom' },

    /*
     * THE ARTWORK HAS PLACEHOLDER TYPE BAKED INTO IT.
     *
     * "Leader's Name, Designation" is not a layer we can turn off — it is
     * pixels, sitting at x 0.1748..0.6123, y 0.9340..0.9633. Drawing our own
     * name on top without covering it first leaves the two overlapping, which
     * is exactly the kind of thing that ships and then cannot be recalled.
     *
     * So the renderer paints this rectangle in the band's own colour first. The
     * colour is sampled from the artwork (rgb(21,21,19)), not assumed to be
     * pure black — it is not.
     */
    clearBox: { x: 0.1628, y: 0.9280, w: 0.4615, h: 0.0413, color: '#151513' },

    /*
     * Name above, designation below.
     *
     * The artwork sets them on ONE line, comma-separated. The office asked for
     * them stacked, so these are two boxes. maxW stops at 0.42 — ending at
     * x 0.595, just clear of the silhouette's left edge at 0.6235, so a long
     * name shrinks rather than running under the photograph.
     */
    name: {
      x: 0.175,
      y: 0.9520,
      maxW: 0.42,
      size: 0.0285,
      weight: 700,
      color: '#FFFFFF',
      align: 'left',
      baseline: 'alphabetic',
    },
    designation: {
      x: 0.175,
      y: 0.9855,
      maxW: 0.42,
      size: 0.0195,
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
export const posterImage = (poster) => `/posters/${poster.slug}.jpg`
