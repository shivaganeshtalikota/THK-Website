/**
 * Newspaper coverage — the cuttings the office keeps, published on /press.
 *
 * Every entry is a real cutting, and every one NAMES HIM in its text. Three
 * cuttings the office supplied are deliberately left out: two reports of the
 * TDP's 44th formation day (30 March 2026) that do not mention him, and a
 * paid Ugadi greeting advertisement (19 March 2026) — an advertisement is not
 * coverage, and a press page that mixes the two is not believable.
 *
 * Headlines are as printed, in Telugu. The English is a faithful summary of
 * what the report says — no claim here goes beyond the cutting. Dates are the
 * edition date where the cutting shows one; otherwise the report's dateline,
 * and `dateline: true` says so.
 *
 * Images: public/press/<slug>.jpg (full) and <slug>-640.webp (thumbnail),
 * made by scripts/process-press.py.
 */

import uploads from './uploads.json'

/** The issues he has taken up, as the reports describe them. */
export const pressIssues = {
  'dumping-yard': {
    title: 'Shift the Jawahar Nagar dumping yard',
    summary:
      'Hyderabad’s garbage is trucked daily to the Jawahar Nagar dumping yard near Nagaram and Keesara. Talikota Hari Krishna has demanded that the yard be moved elsewhere: residents of the surrounding villages live with the stench, polluted water and air, skin and kidney ailments, and groundwater reported contaminated for up to 15 km. He has warned of a larger agitation if the government does not respond.',
  },
  'nagaram-divisions': {
    title: 'Two divisions for Nagaram',
    summary:
      'With Nagaram now part of Greater Hyderabad, TDP leaders led by Talikota Hari Krishna petitioned the Ghatkesar circle Deputy Commissioner in January 2026 to split the large Nagaram division into two, so that sanitation, drinking water, roads and street lighting can be looked after properly.',
  },
}

export const press = [
  {
    slug: '2026-08-02-janam-vaartha-shirdi-sai-temple',
    date: '2026-08-02',
    dateline: true,
    paper: 'Janam Vaartha',
    place: 'LB Nagar',
    topic: 'temple',
    headline: 'ఆలయాలు మానసిక ప్రశాంతతకు నిలయాలు',
    summary:
      'Visiting the Shirdi Sai Baba temple at LB Nagar, Talikota Hari Krishna, member of the Indrakeeladri temple trust board, said temples are places of peace of mind and offered special prayers for the well-being of the people of the state.',
    w: 1030,
    h: 1103,
  },
  {
    slug: '2026-05-27-janam-vaartha-mahanadu',
    date: '2026-05-27',
    dateline: true,
    paper: 'Janam Vaartha',
    place: 'Hyderabad',
    topic: 'party',
    headline: 'మహానాడులో పాల్గొన్న తెలుగు తమ్ముళ్లు',
    summary:
      'At the Mahanadu held at NTR Trust Bhavan on N.T. Rama Rao’s 103rd birth anniversary, TDP senior leader and Sri Kanaka Durga temple trust board member Talikota Hari Krishna garlanded the NTR statue and paid tribute.',
    w: 595,
    h: 996,
  },
  {
    slug: '2026-05-16-janam-vaartha-durga-temple-eo',
    date: '2026-05-16',
    page: 5,
    paper: 'Janam Vaartha',
    place: 'Vijayawada',
    topic: 'temple',
    headline: 'శ్రీ దుర్గామల్లేశ్వర దేవస్థానం ఈఓకు శుభాకాంక్షలు తెలిపిన హరికృష్ణ',
    summary:
      'Talikota Hari Krishna, member of the Sri Kanaka Durga temple trust board, called on the Devasthanam’s Executive Officer Seena Naik to congratulate him on the extension of his tenure, and hoped the temple and its services to devotees would continue to grow under his leadership.',
    w: 585,
    h: 880,
  },
  {
    slug: '2026-04-16-janam-vaartha-nara-lokesh',
    date: '2026-04-16',
    page: 5,
    paper: 'Janam Vaartha',
    place: 'Hyderabad',
    topic: 'party',
    headline: 'తెదేపా నూతన వర్కింగ్ ప్రెసిడెంట్‌ను కలిసిన హరికృష్ణ',
    summary:
      'Talikota Hari Krishna called on minister Nara Lokesh after his election as the TDP’s working president, honouring him with a shawl and bouquet, and congratulated the party’s newly appointed Telangana leaders.',
    w: 580,
    h: 1065,
  },
  {
    slug: '2026-03-27-janam-vaartha-sri-rama-navami',
    date: '2026-03-27',
    page: 5,
    paper: 'Janam Vaartha',
    place: 'Nagaram',
    topic: 'community',
    headline: 'నాగారం ప్రజలకు శ్రీరామనవమి శుభాకాంక్షలు : హరికృష్ణ',
    summary:
      'In a statement to the media, Talikota Hari Krishna — Kanaka Durga temple trust board member and TDP senior leader — wished the people of Nagaram division a happy Sri Rama Navami and asked devotees to celebrate the Sita Rama Kalyanam festivities peacefully.',
    w: 573,
    h: 832,
  },
  {
    slug: '2026-03-18-janam-vaartha-jawahar-nagar-dumping-yard',
    date: '2026-03-18',
    page: 5,
    paper: 'Janam Vaartha',
    place: 'Keesara / Nagaram',
    topic: 'dumping-yard',
    featured: true,
    headline: 'జవహర్ నగర్ డంపింగ్ యార్డ్‌ను మరో చోటికి తరలించాలి',
    summary:
      'A full-page report on the Jawahar Nagar dumping yard. Talikota Hari Krishna said villagers around the yard live amid the stench, suffer skin and kidney ailments from polluted water and air, and that groundwater is reported contaminated for up to 15 km — and demanded the yard be shifted, warning of a larger agitation if the government does not respond.',
    w: 799,
    h: 1280,
  },
  {
    slug: '2026-01-17-news24-ntr-bike-rally',
    date: '2026-01-17',
    paper: 'News24 Telugu',
    place: 'Nagaram',
    topic: 'party',
    headline: 'ఎన్టీ రామారావు 30వ వర్ధంతి సందర్భంగా నాగారం నుండి ఎన్టీఆర్ ఘాట్ వరకు బైక్ ర్యాలీ నిర్వహించిన తాళికోట హరికృష్ణ',
    summary:
      'On N.T. Rama Rao’s 30th death anniversary, Talikota Hari Krishna led a bike rally of TDP leaders and workers from the NTR statue in Nagaram to NTR Ghat, saying NTR’s rule stood for welfare of the poor, respect for women and Telugu self-respect.',
    w: 1220,
    h: 1257,
  },
  {
    slug: '2026-01-09-suryaa-nagaram-divisions',
    date: '2026-01-09',
    page: 3,
    paper: 'Suryaa',
    place: 'Keesara',
    topic: 'nagaram-divisions',
    headline: 'నాగారం డివిజన్‌ను రెండు డివిజన్లుగా విభజించాలి',
    summary:
      'TDP leaders of Nagaram division, including Kanaka Durga temple committee member Talikota Hari Krishna, met Ghatkesar circle Deputy Commissioner A. Vani Reddy to ask that the Nagaram division be split in two, so that sanitation, drinking water, roads and street lights can be supervised better. The Deputy Commissioner promised to take it to senior officials.',
    w: 495,
    h: 1162,
  },
  {
    slug: '2026-01-09-vaartha-nagaram-divisions',
    date: '2026-01-09',
    page: 2,
    paper: 'Vaartha',
    place: 'Ghatkesar',
    topic: 'nagaram-divisions',
    headline: 'నాగారంను రెండు డివిజన్లుగా మార్చాలి',
    summary:
      'Nagaram TDP leaders, among them Talikota Hari Krishna, handed a petition to the Ghatkesar circle Deputy Commissioner asking for Nagaram division to be divided into two.',
    w: 491,
    h: 742,
  },
  {
    slug: '2026-01-09-mana-telangana-nagaram-divisions',
    date: '2026-01-09',
    paper: 'Mana Telangana',
    place: 'Ghatkesar',
    url: 'https://epaper.manatelangana.news/c/78898601',
    topic: 'nagaram-divisions',
    headline: 'నాగారంను రెండు డివిజన్లు చేయాలి',
    summary:
      'TDP leaders including Talikota Hari Krishna met the Ghatkesar circle Deputy Commissioner and asked for Nagaram to be split into two divisions; she said she would take it up with senior officials.',
    w: 533,
    h: 428,
  },
  {
    slug: '2026-01-09-andhra-jyothy-nagaram-divisions',
    date: '2026-01-09',
    page: 8,
    paper: 'Andhra Jyothy',
    place: 'Ghatkesar',
    topic: 'nagaram-divisions',
    headline: 'నాగారాన్ని రెండు డివిజన్లుగా చేయాలి',
    summary:
      'Speaking after the TDP delegation’s meeting with the Deputy Commissioner, Talikota Hari Krishna said local people want Nagaram made into two divisions, because one division this large holds back its development.',
    w: 542,
    h: 836,
  },
  {
    slug: '2023-09-14-eenadu-it-employees',
    date: '2023-09-14',
    paper: 'Eenadu',
    place: 'Hyderabad',
    topic: 'party',
    headline: 'భగ్గుమన్న ఐటీ ఉద్యోగులు',
    summary:
      'IT employees protested at Wipro Circle, Nanakramguda, against the arrest of N. Chandrababu Naidu. The report names Talikota Hari Krishna as president of the Telangana TDP’s IT wing, which called the silent protest.',
    w: 772,
    h: 604,
    also: '2023-09-14-eenadu-it-employees-2',
  },
]

/**
 * Reports published online that name him, with the link to the original.
 * The two below are the appointment of the 2025 trust board: both list him
 * as member no. 5, "హరికృష్ణ – హైదరాబాద్ – టీడీపీ తెలంగాణ".
 */
export const onlineReports = [
  {
    id: 'ntv-2025-09-26-durga-temple-board',
    date: '2025-09-26',
    outlet: 'NTV Telugu',
    byline: 'Sampath Kumar',
    topic: 'temple',
    headline: 'దుర్గ గుడి ఆలయ బోర్డు సభ్యులుగా 16 మంది నియామకం.. లిస్ట్ ఇదే!',
    summary:
      'The Andhra Pradesh government appointed 16 members to the Sri Kanaka Durga temple trust board under chairman Borra Radhakrishna. The published list names Hari Krishna of Hyderabad, TDP Telangana, as member no. 5.',
    url: 'https://ntvtelugu.com/news/vijayawada-durga-temple-board-16-new-members-appointed-full-list-869264.html',
  },
  {
    id: 'disha-2025-09-26-durga-temple-board',
    date: '2025-09-26',
    outlet: 'Disha Daily',
    byline: 'Ramesh Naini',
    topic: 'temple',
    headline: 'విజయవాడ కనకదుర్గ ఆలయ కమిటీ నియామకం.. బోర్డు సభ్యులు 16 మంది.. ప్రభుత్వం ఉత్తర్వులు',
    summary:
      'Report on the government order appointing the 16-member Kanaka Durga temple committee. Hari Krishna — Hyderabad, TDP Telangana — is listed as member no. 5.',
    url: 'https://www.dishadaily.com/andhrapradesh/vijayawada-kanakadurga-temple-committee-appointment-478807',
  },
]

/** The temple's own record of its trust board. */
export const officialRecord = {
  label: 'Sri Durga Malleswara Swamy Varla Devasthanam — Temple Administration, Trust Board',
  summary: 'The Devasthanam’s official website lists Talikota Hari Krishna among the members of its trust board, under chairman Borra Radha Krishna (Gandhi).',
  url: 'https://kanakadurgamma.org/tenders',
}

/**
 * Interviews and television coverage on YouTube. Thumbnails are kept locally
 * in public/photos/video (the site loads no third-party images); the video
 * plays in the page through youtube-nocookie.com.
 */
export const interviews = [
  {
    id: 'gPpUGw1h88g',
    date: '2023-09-29',
    channel: 'Leo Telangana',
    kind: 'Interview',
    title: 'ఇబ్బంది పెట్టినా తెలంగాణలో చంద్రబాబుకే మద్దతు',
    summary: 'Interview as iTDP president after N. Chandrababu Naidu’s arrest: however much the party’s supporters are troubled, in Telangana their support stays with Chandrababu.',
    minutes: 7,
  },
  {
    id: 'pikT5aJJy7I',
    date: '2023-09-13',
    channel: 'V6 News',
    kind: 'News report',
    title: 'TDP IT Wing Employees Protest Over Chandra Babu Arrest At Wipro Circle',
    summary: 'Television coverage of the protest by IT employees at Wipro Circle, Gachibowli — the silent protest called by the Telangana TDP’s IT wing, which he leads.',
    minutes: 1,
  },
  {
    id: 'EyfkvHu_UGM',
    date: '2023-07-05',
    channel: 'RTV Telugu',
    kind: 'Interview',
    title: 'iTDP State Leader Talikota Harikrishna on the KCR government',
    summary: 'Speaking to RTV as the iTDP state leader, he criticised the BRS government of K. Chandrashekar Rao, saying only media that praise the government enjoy freedom in Telangana.',
    minutes: 7,
  },
  {
    id: 'N2TWmdgpl_Y',
    date: '2023-07-03',
    channel: 'RTV Telugu',
    kind: 'Speech',
    title: 'Talikota Harikrishna on the iTDP social media team',
    summary: 'A speech on the work of the iTDP social media team — the party wing, he said, that brings people’s problems to the attention of its leaders.',
    minutes: 4,
  },
]

export const pressImage = (slug) => `/press/${slug}.jpg`
export const pressThumb = (slug) => `/press/${slug}-640.webp`

/**
 * Every cutting as one list, newest first: the ones kept here and the ones
 * the office adds from the admin panel (uploads.json → press). Shaped the
 * same way so the page treats them alike.
 */
export const cuttings = [
  ...(uploads.press ?? []).map((u) => ({
    slug: u.id,
    date: u.date,
    page: u.page,
    paper: u.paper,
    topic: u.topic,
    headline: u.title,
    summary: u.summary,
    image: u.src || null,
    thumb: u.src || null,
    w: u.width,
    h: u.height,
    url: u.sources?.[0]?.url,
  })),
  ...press.map((p) => ({ ...p, image: pressImage(p.slug), thumb: pressThumb(p.slug), also: p.also ? pressImage(p.also) : null })),
].sort((a, b) => String(b.date).localeCompare(String(a.date)))
