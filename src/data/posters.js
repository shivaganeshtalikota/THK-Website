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
     * Every number here is READ OFF the original artwork's silhouette, which is
     * the slot the designer drew. The earlier values were guessed, and the guess
     * put the photograph on top of the yellow band's Telugu line in every poster
     * generated before anyone measured.
     *
     * The subtlety is that the silhouette is a standing FIGURE — narrow at the
     * head, wide at the shoulders — so its bounding box is not its outline. The
     * box starts at x 0.6221, left of where the Telugu ends (0.6543), and
     * reading only the box would suggest the artwork overlaps its own text. It
     * does not: 0.6221 is the shoulders, and the shoulders are below the yellow
     * band entirely. Walked row by row through the band, the figure never comes
     * left of 0.6753, and at the tightest row it keeps 120px clear of the type.
     *
     *   figure, within the yellow band   x >= 0.6753   <- the binding constraint
     *   figure, overall bounding box     x >= 0.6221
     *   yellow-band Telugu ends at       x  = 0.6543
     *   silhouette head top              y  = 0.6293
     *
     * A rectangle cannot taper, so the slot takes the band constraint and
     * applies it over the whole height. That costs a little width at the
     * shoulders against the original composition, and buys a guarantee that no
     * photograph, whatever shape its subject turns out to be, can reach the text.
     *
     * The person is fitted to CONTAIN this box, so a narrower slot makes the
     * portrait smaller — never stretched, never cropped into.
     */
    photoSlot: { x: 0.6753, y: 0.6293, w: 0.3247, h: 0.3707, anchor: 'bottom' },

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
     *
     * LINE SPACING. The baselines sit 0.0300 apart — 77px against a 67px name.
     * They were 0.0196 apart, i.e. 50px of leading under a 67px font, which is
     * tighter than the type is tall: the name's descenders ran into the
     * designation's ascenders and the two lines read as one smudge. Telugu is
     * the demanding case here, since its vowel marks reach well above and below
     * the Latin baseline, and 77px clears them.
     *
     * The pair is then positioned so the BLOCK, not either baseline, centres on
     * the mark: cap-height above the name plus the designation's baseline puts
     * the visual middle at 0.9439, the mark's measured centre.
     */
    name: {
      x: 0.185,
      y: 0.9383,
      maxW: 0.40,
      size: 0.026,
      weight: 700,
      color: '#FFFFFF',
      align: 'left',
      baseline: 'alphabetic',
    },
    designation: {
      x: 0.185,
      y: 0.9683,
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

/**
 * The poster's social card — what a link to it previews as.
 *
 * A separate file from the artwork, because the artwork is the wrong shape and
 * far too heavy for the job: 2048x2560 and 862KB against crawlers that want
 * roughly 1.91:1 and a couple of hundred KB. Handing them the poster itself
 * gets no preview on WhatsApp and an arbitrary crop everywhere else.
 *
 * Built by scripts/make-poster-cards.py, and versioned with the artwork it came
 * from so a corrected poster cannot leave a stale card cached behind it.
 */
export const posterCard = (poster) => `/posters/${poster.slug}-card-v${poster.version}.jpg`
