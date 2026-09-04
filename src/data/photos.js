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
  'ntr-anniversary-tribute': [480, 768, 1200, 1600],
  'csr-summit-hyderabad': [480, 768, 1200, 1600],
}

const photo = (slug, width, height, alt, extra = {}) => ({
  slug,
  width,
  height,
  alt,
  widths: W[slug],
  src: `/photos/${slug}.jpg`,
  ...extra,
})

/** Key photos placed deliberately on specific pages. */
export const photos = {
  // Cropped head-and-shoulders from the greeting photograph — the only frame
  // with him clean, front-facing and well lit. See CROPS in
  // scripts/process-photos.py for the exact box.
  hero: photo(
    'portrait-headshot',
    621,
    828,
    'Hari Krishna Talikota, iTDP Telangana State President'
  ),
  about: photo(
    'with-chandrababu-naidu-portrait',
    2048,
    2046,
    'Hari Krishna Talikota with TDP National President N. Chandrababu Naidu'
  ),
  political: photo(
    'addressing-itdp-telangana',
    2048,
    1365,
    'Hari Krishna Talikota addressing an iTDP Telangana party meeting'
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
