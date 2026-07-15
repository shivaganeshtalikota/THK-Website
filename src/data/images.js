/**
 * Photo manifest — the drop-in point for real photography.
 *
 * WHY THIS FILE EXISTS
 * The project shipped with zero image files. Its only photo was hotlinked from
 * Facebook's CDN via a signed URL (`...&oe=6A05FBC0`); those URLs expire, and
 * that one now returns HTTP 403 — the homepage hero was a broken image.
 * Nothing here hotlinks. Every path is a local file under /public/images/.
 *
 * TO ADD THE REAL PHOTOS
 *   1. Drop the file into  public/images/  using the exact `src` filename below.
 *   2. Nothing else. The <Photo> component picks it up automatically and the
 *      designed fallback disappears.
 *
 * Until a file exists, <Photo> renders a branded placeholder rather than a
 * broken-image icon, so the site looks intentional in the meantime.
 *
 * Recommended: 3:4 portrait for `portrait`, 16:9 for event shots, WebP or JPEG,
 * ~2000px on the long edge, under ~400KB each.
 */

export const photos = {
  portrait: {
    src: '/images/hari-krishna-talikota-portrait.jpg',
    alt: 'Hari Krishna Talikota, iTDP Telangana State President',
    aspect: '3 / 4',
    note: 'Primary hero portrait. Formal headshot, ideally in TDP yellow. Shot with headroom — it anchors the homepage.',
  },
  political: {
    src: '/images/political-leadership.jpg',
    alt: 'Hari Krishna Talikota addressing a Telugu Desam Party gathering',
    aspect: '16 / 9',
    note: 'Rally, public meeting or press conference. Header for the Political Leadership page.',
  },
  community: {
    src: '/images/community-service.jpg',
    alt: 'Sri Kanaka Durga Temple at Indrakeeladri Hill, Vijayawada',
    aspect: '16 / 9',
    note: 'Temple or temple-board activity. Header for the Community Service page.',
  },
  about: {
    src: '/images/about-portrait.jpg',
    alt: 'Hari Krishna Talikota',
    aspect: '4 / 5',
    note: 'Secondary portrait — a more candid/working shot than the hero.',
  },
}

/**
 * Gallery grid on the Media page. Empty until real event photography exists;
 * the page renders an honest empty state rather than filler.
 * Add as: { src: '/images/gallery/rally-2026-05.jpg', alt: '...', caption: '...' }
 */
export const gallery = []
