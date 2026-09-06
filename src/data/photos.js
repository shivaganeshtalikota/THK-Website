/**
 * Photo manifest — real photography, supplied by the office.
 *
 * Generated assets live in /public/photos/ as WebP at several widths plus a
 * JPEG fallback; the untouched originals are kept out of the served bundle in
 * photos-source/original-drop/. Regenerate with `npm run photos`.
 *
 * `telugu` holds the original caption the photo arrived with. It is shown
 * alongside the English caption rather than discarded — this is a Telugu
 * politician's site and the Telugu is the primary voice.
 *
 * NOT PUBLISHED (see scripts/process-photos.py EXCLUDED for the full reason):
 *   - The Amaravati family photo: carries a visible "AI-generated content"
 *     watermark burned into the pixels.
 *   - "మా బాబు గారిని": a composite poster, not documentary photography.
 */

/** Absolute width list per slug, mirroring what the processor emitted. */
const W = {
  'tdp-44-anniversary': [480, 768, 960],
  'hero-addressing': [480, 768, 1200, 1800, 1820],
  'portrait-headshot': [480, 621],
  'addressing-itdp-telangana': [480, 768, 1200, 1800, 2048],
  'with-chandrababu-naidu': [480, 768, 1200, 1800, 2048],
  'with-nara-lokesh': [480, 768, 1200, 1290],
  'with-chandrababu-naidu-portrait': [480, 768, 1200, 1800, 2048],
  'greeting-chandrababu-naidu': [480, 768, 1200, 1776],
  'with-party-leadership': [480, 768, 1200, 1729],
  'bonalu-bangaru-bonam': [480, 768, 967],
  'kuchipudi-natya-kshetram': [480, 768, 1200, 1800, 2048],
  'kuchipudi-natyotsavam-stage': [480, 768, 1200, 1800, 2048],
  'jonnawada-kamakshi-thayi': [480, 768, 1064],
  'medchal-constituency-meeting': [480, 768, 1200, 1800, 2048],
  'medchal-constituency-dais': [480, 768, 1200, 1800, 2048],
  'endowments-minister-anam': [480, 768, 1200, 1280],
  'with-nandamuri-balakrishna': [480, 768, 1153],
  'mahanadu-2025': [480, 768, 1024],
  'ntr-anniversary-tribute': [480, 768, 1200, 1600, 1800],
  'amaravati-cm-meeting': [480, 768, 1200, 1800, 2048],
  'csr-summit-hyderabad': [480, 768, 1200, 1600],
}

/**
 * Focal point per photograph, as a CSS object-position.
 *
 * WHY THIS EXISTS
 * Every container on the site crops with object-fit:cover, and the default is
 * `50% 50%` — which is only correct when the subject happens to sit dead centre.
 * In press photography it almost never does. The bonam photograph is a 0.69
 * portrait whose subject's face sits at 58% height; centred in a near-square
 * box it pushed his face onto the bottom edge. The group photographs put their
 * faces in the upper third, so a centred crop clipped foreheads.
 *
 * These values were measured, not guessed: scripts/audit-images.py runs an
 * OpenCV cascade over every file and reports the area-weighted centre of the
 * faces it finds (scripts/image-audit.json). Where the detector found nothing,
 * or was dragged off by background faces, the value is corrected by eye and
 * the reason noted.
 */
const FOCUS = {
  // Detected cleanly — faces in the upper third, as usual for a handshake or
  // a greeting frame.
  'with-chandrababu-naidu': '50% 30%',
  'with-chandrababu-naidu-portrait': '52% 32%',
  'with-nara-lokesh': '52% 28%',
  'with-nandamuri-balakrishna': '58% 28%',
  'with-party-leadership': '62% 40%',
  'addressing-itdp-telangana': '56% 30%',
  'hero-addressing': '57% 38%',
  'portrait-headshot': '55% 35%',
  'csr-summit-hyderabad': '59% 46%',
  'mahanadu-2025': '55% 45%',
  'ntr-anniversary-tribute': '55% 42%',
  'amaravati-cm-meeting': '57% 40%',
  'tdp-44-anniversary': '48% 45%',
  'hero-tdp-44': '48% 45%',
  'jonnawada-kamakshi-thayi': '38% 52%',
  'kuchipudi-natyotsavam-stage': '58% 44%',

  // The subject carries the bonam on his head, so the frame is pot-above-face.
  // The detector puts his face at 58%; the old hand-set value of 28% chased the
  // pot instead and pushed his face out of the bottom of the box.
  'bonalu-bangaru-bonam': '47% 58%',

  // Corrected by eye. The detector found no frontal face here — both men are
  // turned three-quarters — but they are plainly at 32% and 70% across, high
  // in the frame.
  'greeting-chandrababu-naidu': '50% 26%',

  // Corrected by eye. Ultra-wide at 2.22, no face detected against the busy
  // background; the handshake sits slightly above centre.
  'endowments-minister-anam': '50% 40%',

  // Corrected. The detector locked onto the two clearest faces on the right of
  // a wide hall and returned 80%, which would crop the audience out entirely.
  // Pulled back toward the standing speaker while keeping the crowd in frame.
  'medchal-constituency-dais': '62% 46%',

  // Corrected. Detection averaged the standing speaker with the seated row
  // behind him and landed at mid-height; his own face is higher.
  'medchal-constituency-meeting': '45% 24%',

  // Corrected. Detection returned 70% — the dancers' faces — but at banner
  // height that drops the gopuram the photograph is composed around.
  'kuchipudi-natya-kshetram': '45% 46%',
}

const photo = (slug, width, height, alt, extra = {}) => ({
  slug,
  width,
  height,
  alt,
  widths: W[slug],
  src: `/photos/${slug}.jpg`,
  focus: FOCUS[slug] ?? '50% 50%',
  ...extra,
})

/** Key photos placed deliberately on specific pages. */
export const photos = {
  // Homepage hero: the podium frame, cropped to portrait. It is the most
  // clearly political image in the set — TDP yellow, the iTDP badge, and the
  // Telangana map on the lectern all read at a glance.
  hero: photo(
    'hero-addressing',
    1820,
    1365,
    'Hari Krishna Talikota addressing an iTDP Telangana party meeting'
  ),

  // Head-and-shoulders crop from the greeting photograph. Not placed on a page
  // — it is the portrait composited into the social preview card by
  // scripts/generate-assets.py, where a clear front-facing face matters most.
  headshot: photo(
    'portrait-headshot',
    621,
    828,
    'Hari Krishna Talikota, iTDP Telangana State President'
  ),
  // Portrait, used inside the biography column (not as a banner).
  about: photo(
    'with-chandrababu-naidu-portrait',
    2048,
    2046,
    'Hari Krishna Talikota with TDP National President N. Chandrababu Naidu'
  ),

  /**
   * Page banners. These are chosen for being NATIVELY WIDE — a 2048x2046
   * square or a 967x1409 portrait cropped down to a 56vh band cuts heads in
   * half, which is exactly what was happening on About and Political.
   */
  // Public service, not private life. This was the Amaravati frame, which is a
  // family photograph — the wrong register for the banner of a page about his
  // work, and the office asked for it to appear only in the gallery. This is
  // him on his feet at a constituency opinion-gathering programme.
  bannerAbout: photo(
    'medchal-constituency-meeting',
    2048,
    1538,
    'Hari Krishna Talikota speaking at a constituency opinion-gathering programme in Medchal'
  ),
  bannerPolitical: photo(
    'medchal-constituency-dais',
    2048,
    1536,
    'Hari Krishna Talikota at an opinion-gathering programme in Medchal constituency'
  ),
  // The indoor stage frame was tried here and rejected on measurement: behind
  // the banner scrim its mean luminance was 0.025 against this one's 0.117, so
  // it rendered as a near-black rectangle. This photograph was previously
  // duplicated as a tile in the grid at the foot of this same page; the grid
  // now filters the banner out by slug, so it can stay.
  bannerCommunity: photo(
    'kuchipudi-natya-kshetram',
    2048,
    1465,
    'Kuchipudi dancers with Hari Krishna Talikota before the temple gopuram at the Shravana Maasa Nrityotsavam'
  ),
  // Swapped off ntr-anniversary-tribute, which was also a tile in the gallery
  // directly below it, and whose largest variant is smaller than a full-bleed
  // desktop band needs.
  bannerMedia: photo(
    'addressing-itdp-telangana',
    2048,
    1365,
    'Hari Krishna Talikota addressing an iTDP Telangana party meeting'
  ),
  political: photo(
    'ntr-anniversary-tribute',
    1800,
    1350,
    'Telugu Desam Party workers paying tribute at an N.T. Rama Rao statue'
  ),
  community: photo(
    'bonalu-bangaru-bonam',
    967,
    1409,
    'Hari Krishna Talikota carrying the bonam during the Sri Bhagyanagar Mahankali Bonalu Jatara procession'
  ),
  leadership: photo(
    'with-nara-lokesh',
    1290,
    1187,
    'Hari Krishna Talikota with TDP National Working President Nara Lokesh'
  ),
  constituency: photo(
    'medchal-constituency-meeting',
    2048,
    1538,
    'Hari Krishna Talikota speaking at an opinion-gathering programme in Medchal constituency'
  ),
}

/**
 * Media-page gallery, grouped so visitors can filter.
 * Captions are the office's own words; the Telugu is the original post text.
 */
export const gallery = [
  {
    ...photo(
      'with-chandrababu-naidu',
      2048,
      1365,
      'Hari Krishna Talikota welcoming TDP National President N. Chandrababu Naidu'
    ),
    group: 'party',
    caption: 'Welcoming TDP National President N. Chandrababu Naidu',
  },
  {
    ...photo(
      'with-nara-lokesh',
      1290,
      1187,
      'Hari Krishna Talikota with TDP National Working President Nara Lokesh'
    ),
    group: 'party',
    caption: 'With TDP National Working President Nara Lokesh',
  },
  {
    ...photo(
      'greeting-chandrababu-naidu',
      1776,
      1677,
      'Hari Krishna Talikota greeting TDP National President N. Chandrababu Naidu'
    ),
    group: 'party',
    caption: 'Greeting TDP National President N. Chandrababu Naidu',
  },
  {
    ...photo(
      'with-party-leadership',
      1729,
      1655,
      'Hari Krishna Talikota with TDP National President N. Chandrababu Naidu'
    ),
    group: 'party',
    caption: 'With the TDP national leadership',
  },
  {
    ...photo(
      'with-nandamuri-balakrishna',
      1153,
      2048,
      'Hari Krishna Talikota with Nandamuri Balakrishna, Hindupur MLA, beneath a portrait of N.T. Rama Rao'
    ),
    group: 'party',
    caption: 'With Nandamuri Balakrishna, Hindupur MLA',
    telugu: 'పద్మభూషణ్ పురస్కారానికి ఎంపికైన నందమూరి బాలకృష్ణ గారికి హృదయపూర్వక శుభాకాంక్షలు.',
  },
  {
    ...photo(
      'tdp-44-anniversary',
      960,
      1280,
      'Hari Krishna Talikota in Telugu Desam Party colours at the party’s 44th anniversary celebration'
    ),
    group: 'party',
    caption: 'At the Telugu Desam Party’s 44th anniversary celebration',
    telugu: '44 వసంతాల తెలుగుదేశం పార్టీ',
  },
  {
    ...photo(
      'amaravati-cm-meeting',
      2048,
      1283,
      'Hari Krishna Talikota with family meeting Chief Minister N. Chandrababu Naidu in Amaravati'
    ),
    group: 'party',
    caption: 'Meeting Chief Minister N. Chandrababu Naidu with family in Amaravati',
    telugu:
      'నిన్న అమరావతిలో ముఖ్యమంత్రి శ్రీ నారా చంద్రబాబు నాయుడు గారిని కుటుంబసమేతంగా కలిసి కృతజ్ఞతలు తెలియజేయడం జరిగింది.',
  },
  {
    ...photo('mahanadu-2025', 1024, 768, 'Delegate registration at TDP Mahanadu 2025'),
    group: 'party',
    caption: 'Delegate registration at Mahanadu 2025',
    telugu: 'మహానాడు 2025 ప్రతినిధుల నమోదు',
  },
  {
    ...photo(
      'ntr-anniversary-tribute',
      1600,
      1200,
      'TDP workers paying tribute at an N.T. Rama Rao statue during the party’s 40th anniversary'
    ),
    group: 'party',
    caption: 'Paying tribute to N.T. Rama Rao on the party’s anniversary',
    telugu: '40 వసంతాల పండుగ',
  },
  {
    ...photo(
      'medchal-constituency-meeting',
      2048,
      1538,
      'Hari Krishna Talikota speaking at an opinion-gathering programme in Medchal constituency'
    ),
    group: 'constituency',
    caption: 'Speaking at an opinion-gathering programme in Medchal constituency',
    telugu: 'ఈరోజు మేడ్చల్ నియోజకవర్గం లో నిర్వహించిన అభిప్రాయ సేకరణ కార్యక్రమంలో పాల్గొనడం జరిగింది.',
  },
  {
    ...photo('medchal-constituency-dais', 2048, 1536, 'Opinion-gathering programme in Medchal constituency'),
    group: 'constituency',
    caption: 'The opinion-gathering programme in Medchal constituency',
    telugu: 'మేడ్చల్ నియోజకవర్గం అభిప్రాయ సేకరణ కార్యక్రమం',
  },
  {
    ...photo(
      'csr-summit-hyderabad',
      1600,
      1067,
      'Hari Krishna Talikota with Narasaraopet MLA Chadalavada Aravind Babu at the CSR Summit, Hyderabad'
    ),
    group: 'constituency',
    caption: 'With Narasaraopet MLA Chadalavada Aravind Babu at the CSR Summit, Hyderabad',
  },
  {
    ...photo(
      'endowments-minister-anam',
      1280,
      577,
      'Hari Krishna Talikota paying a courtesy call on Endowments Minister Anam Ramanarayana Reddy'
    ),
    group: 'temple',
    caption: 'A courtesy call on Endowments Minister Anam Ramanarayana Reddy',
    telugu: 'దేవాదాయ శాఖ మంత్రి ఆనం రామనారాయణరెడ్డి గారిని వారి స్వగృహంలో మర్యాదపూర్వకంగా కలవడం జరిగింది.',
  },
  {
    ...photo(
      'bonalu-bangaru-bonam',
      967,
      1409,
      'Hari Krishna Talikota carrying the bonam during the Sri Bhagyanagar Mahankali Bonalu Jatara procession'
    ),
    group: 'temple',
    caption:
      'Carrying the bonam in the Sri Bhagyanagar Mahankali Bonalu Jatara procession, offered to Sri Kanaka Durga Ammavaru of Vijayawada',
    telugu:
      'శ్రీ భాగ్యనగర్ మహంకాళి బోనాల జాతర ఉమ్మడి దేవాలయాల ఊరేగింపు కమిటీ ఆధ్వర్యంలో, విజయవాడ శ్రీ కనకదుర్గ అమ్మవారికి బంగారు బోనం సమర్పణ',
  },
  {
    ...photo(
      'jonnawada-kamakshi-thayi',
      1064,
      1472,
      'Hari Krishna Talikota carrying offerings at Sri Kamakshi Thayi temple, Jonnawada'
    ),
    group: 'temple',
    caption: 'At Sri Kamakshi Thayi temple, Jonnawada',
    telugu: 'జొన్నవాడ కామాక్షి తాయి',
  },
  {
    ...photo(
      'kuchipudi-natya-kshetram',
      2048,
      1465,
      'Kuchipudi dancers assembled before a temple gopuram at the Shravana Maasa Nrityotsavam'
    ),
    group: 'culture',
    caption: 'Kuchipudi dancers at the Shravana Maasa Nrityotsavam',
    telugu: 'శ్రీ దత్త కూచిపూడి నాట్య కళాక్షేత్రం, బేగంపేట — శ్రావణమాస నాట్యోత్సవం',
  },
  {
    ...photo(
      'kuchipudi-natyotsavam-stage',
      2048,
      1363,
      'Hari Krishna Talikota with performers at the Shravana Maasa Nrityotsavam dance festival'
    ),
    group: 'culture',
    caption:
      'With performers at the Shravana Maasa Nrityotsavam, Sri Datta Kuchipudi Natya Kshetram, Begumpet',
    telugu:
      'నిన్న శ్రీ దత్త కూచిపూడి నాట్య కళాక్షేత్రం, బేగంపేట, తెలంగాణ వారి ఆధ్వర్యంలో నిర్వహించిన శ్రావణమాస నాట్యోత్సవం కార్యక్రమంలో పాల్గొనడం ఎంతో ఆనందంగా ఉంది.',
  },
]

export const galleryGroups = [
  { id: 'all', label: 'All' },
  { id: 'party', label: 'Party & Leadership' },
  { id: 'constituency', label: 'Constituency' },
  { id: 'temple', label: 'Temple & Devotion' },
  { id: 'culture', label: 'Telugu Culture' },
]
