/**
 * Every video on the site, each with its own watch page at /videos/<slug>.
 *
 * WHY WATCH PAGES
 * Google indexes a video only from a page whose main content IS that video —
 * its "watch page". Until October 2026 the site had none: the videos were a
 * strip of thumbnails on /media, a pop-up player on /press, and one interview
 * written into the site-wide structured data, which put a "video" on every
 * page. Search Console's verdict on all of them was "Video isn't on a watch
 * page", and not one was indexed. Now each video has a page that leads with
 * the player, and only that page describes it as a VideoObject.
 *
 * WHAT IS HERE
 * Four interviews and news reports from Telugu channels, and the videos of
 * Team Haranna, youtube.com/@TeamHaranna — a supporter-run channel, NOT the
 * office's, and labelled that way wherever it appears.
 *
 * uploadDate, seconds and the shape (vertical for Shorts) are YouTube's own
 * values, read from each video's public page. The titles are written in plain
 * words (the channels' titles are hashtag-stuffed), with the Telugu alongside;
 * the descriptions state only what the video and its channel's own description
 * say.
 *
 * Thumbnails are self-hosted: /photos/video/<id>.webp (640px, for the grids)
 * and /photos/video/<id>.jpg (1280px, for the watch page, search results and
 * link previews).
 */

export const CHANNELS = {
  leo: { name: 'Leo Telangana', nameTe: 'లియో తెలంగాణ', id: 'UCH0-k8hL9GOXeDBEhWFgxRg', url: 'https://www.youtube.com/channel/UCH0-k8hL9GOXeDBEhWFgxRg' },
  v6: { name: 'V6 News Telugu', nameTe: 'వీ6 న్యూస్', id: 'UCDCMjD1XIAsCZsYHNMGVcog', url: 'https://www.youtube.com/channel/UCDCMjD1XIAsCZsYHNMGVcog' },
  rtv: { name: 'RTV Telugu', nameTe: 'ఆర్టీవీ తెలుగు', id: 'UC1a3sxGl2zoC_Sbr2Y2S4cg', url: 'https://www.youtube.com/channel/UC1a3sxGl2zoC_Sbr2Y2S4cg' },
  haranna: { name: 'Team Haranna', nameTe: 'టీమ్ హరన్న', id: 'UCGGggwMXVxhNY9q9CZ6325Q', url: 'https://www.youtube.com/channel/UCGGggwMXVxhNY9q9CZ6325Q' },
}

/** Team Haranna: kept as `channel` for the places that credit it. */
export const channel = {
  handle: '@TeamHaranna',
  name: 'Team Haranna',
  // Shown wherever the channel is credited, so the relationship is never
  // overstated anywhere on the site.
  relationship: 'Supporter-run channel, not operated by the office',
  id: 'UCGGggwMXVxhNY9q9CZ6325Q',
  url: 'https://www.youtube.com/@TeamHaranna',
}

export const allVideos = [
  {
    id: 'gPpUGw1h88g',
    slug: 'leo-telangana-interview-support-for-chandrababu',
    group: 'interview',
    channel: 'leo',
    kind: 'Interview',
    title: 'Leo Telangana interview: in Telangana, support stays with Chandrababu',
    titleTe: 'ఇబ్బంది పెట్టినా తెలంగాణలో చంద్రబాబుకే మద్దతు — లియో తెలంగాణ ఇంటర్వ్యూ',
    description: 'Interview as iTDP Telangana State President after N. Chandrababu Naidu’s arrest in September 2023: however much the party’s supporters are troubled, in Telangana their support stays with Chandrababu.',
    descriptionTe: 'సెప్టెంబర్ 2023లో నారా చంద్రబాబు నాయుడు అరెస్టు తర్వాత ఐటీడీపీ తెలంగాణ రాష్ట్ర అధ్యక్షునిగా లియో తెలంగాణకు ఇచ్చిన ఇంటర్వ్యూ: పార్టీ అభిమానులను ఎన్ని ఇబ్బందులు పెట్టినా తెలంగాణలో వారి మద్దతు చంద్రబాబుకే.',
    uploadDate: '2023-09-29T02:04:12-07:00',
    seconds: 426,
    vertical: false,
  },
  {
    id: 'pikT5aJJy7I',
    slug: 'v6-news-itdp-wipro-circle-protest',
    group: 'interview',
    channel: 'v6',
    kind: 'News report',
    title: 'V6 News: IT employees protest at Wipro Circle over Chandrababu Naidu’s arrest',
    titleTe: 'విప్రో సర్కిల్ వద్ద ఐటీ ఉద్యోగుల నిరసన — వీ6 న్యూస్',
    description: 'Television coverage of the protest by IT employees at Wipro Circle, Gachibowli, Hyderabad — the silent protest called by the Telangana TDP’s IT wing, which he leads, after N. Chandrababu Naidu’s arrest.',
    descriptionTe: 'నారా చంద్రబాబు నాయుడు అరెస్టుకు నిరసనగా హైదరాబాద్ గచ్చిబౌలి విప్రో సర్కిల్ వద్ద ఐటీ ఉద్యోగుల మౌన నిరసనపై వీ6 న్యూస్ కథనం — ఆయన నేతృత్వంలోని తెలంగాణ టీడీపీ ఐటీ విభాగం పిలుపుతో.',
    uploadDate: '2023-09-13T05:21:01-07:00',
    seconds: 54,
    vertical: false,
  },
  {
    id: 'EyfkvHu_UGM',
    slug: 'rtv-interview-on-the-kcr-government',
    group: 'interview',
    channel: 'rtv',
    kind: 'Interview',
    title: 'RTV interview: the iTDP state leader on the KCR government',
    titleTe: 'కేసీఆర్ ప్రభుత్వంపై ఐటీడీపీ రాష్ట్ర నాయకుడు తాళికోట హరికృష్ణ — ఆర్టీవీ ఇంటర్వ్యూ',
    description: 'Speaking to RTV as the iTDP state leader in July 2023, he criticised the BRS government of K. Chandrashekar Rao, saying only media that praise the government enjoy freedom in Telangana.',
    descriptionTe: 'జూలై 2023లో ఐటీడీపీ రాష్ట్ర నాయకునిగా ఆర్టీవీతో మాట్లాడుతూ కె. చంద్రశేఖర రావు నేతృత్వంలోని బీఆర్ఎస్ ప్రభుత్వాన్ని విమర్శించారు; తెలంగాణలో ప్రభుత్వాన్ని పొగిడే మీడియాకే స్వేచ్ఛ ఉందన్నారు.',
    uploadDate: '2023-07-05T04:45:00-07:00',
    seconds: 416,
    vertical: false,
  },
  {
    id: 'N2TWmdgpl_Y',
    slug: 'rtv-speech-on-the-itdp-social-media-team',
    group: 'interview',
    channel: 'rtv',
    kind: 'Speech',
    title: 'RTV: speech on the iTDP social media team',
    titleTe: 'ఐటీడీపీ సోషల్ మీడియా బృందంపై తాళికోట హరికృష్ణ ప్రసంగం — ఆర్టీవీ',
    description: 'A speech on the work of the iTDP social media team — the party wing, he said, that brings people’s problems to the attention of its leaders.',
    descriptionTe: 'ఐటీడీపీ సోషల్ మీడియా బృందం పనిపై ప్రసంగం — ప్రజల సమస్యలను పార్టీ నాయకుల దృష్టికి తీసుకెళ్లే విభాగం అదేనని ఆయన అన్నారు.',
    uploadDate: '2023-07-03T01:00:13-07:00',
    seconds: 249,
    vertical: false,
  },
  {
    id: 't_26uwmonIA',
    slug: 'kanaka-durga-temple-saree-offering-to-mahankali-ammavaru',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Sri Kanaka Durga temple’s saree offering to Mahankali Ammavaru, Hyderabad',
    titleTe: 'శ్రీ కనకదుర్గ అమ్మవారి సారే సమర్పణ — హైదరాబాద్ మహంకాళి అమ్మవారికి',
    description: 'On behalf of the Sri Durga Malleswara Swamy Varla Devasthanam on Indrakeeladri, Vijayawada, a saree is offered to Mahankali Ammavaru in Hyderabad’s Old City for the Bonalu festival.',
    descriptionTe: 'విజయవాడ ఇంద్రకీలాద్రిపై కొలువై ఉన్న శ్రీ దుర్గా మల్లేశ్వర స్వామి వార్ల దేవస్థానం తరఫున బోనాల సందర్భంగా హైదరాబాద్ ఓల్డ్ సిటీ మహంకాళి అమ్మవారికి సారే సమర్పణ.',
    uploadDate: '2026-08-09T22:30:04-07:00',
    seconds: 24,
    vertical: true,
  },
  {
    id: '08ZalRdw2b0',
    slug: 'welcoming-kanaka-durga-temple-saree-offering-hyderabad-bonalu',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Welcoming the Kanaka Durga temple’s saree offering, Hyderabad Bonalu',
    titleTe: 'శ్రీ విజయవాడ కనకదుర్గ అమ్మవారి సారే సమర్పణకు ఘన స్వాగతం — హైదరాబాద్ బోనాలు',
    description: 'A welcome and felicitation in Hyderabad for the temple board chairman, members, priests and staff who came from Vijayawada to offer a saree to Mahankali Ammavaru in the Old City.',
    descriptionTe: 'హైదరాబాద్ ఓల్డ్ సిటీ మహంకాళి అమ్మవారికి సారే సమర్పించేందుకు విజయవాడ నుంచి వచ్చిన ఆలయ ఛైర్మన్, కమిటీ సభ్యులు, అర్చకులు, దేవస్థాన ఉద్యోగులకు ఘన స్వాగతం, సత్కారం.',
    uploadDate: '2026-08-08T00:30:20-07:00',
    seconds: 34,
    vertical: true,
  },
  {
    id: '9J7qTrF9w2Y',
    slug: 'talikota-harikrishna-telugu-desam-party',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Talikota Harikrishna — Telugu Desam Party',
    titleTe: 'తాళికోట హరికృష్ణ — తెలుగుదేశం పార్టీ',
    description: 'A short video about Talikota Hari Krishna and his work in the Telugu Desam Party.',
    descriptionTe: 'తెలుగుదేశం పార్టీలో తాళికోట హరికృష్ణ కృషిపై షార్ట్ వీడియో.',
    uploadDate: '2026-08-05T00:15:14-07:00',
    seconds: 29,
    vertical: true,
  },
  {
    id: '2RI8IEb9rlU',
    slug: 'chandrababu-naidu-birthday-celebrations-2026',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Chandrababu Naidu birthday celebrations, 2026',
    titleTe: 'చంద్రబాబు నాయుడు గారి పుట్టినరోజు వేడుకలు, 2026',
    description: 'TDP leaders and workers celebrate the birthday of Andhra Pradesh Chief Minister N. Chandrababu Naidu, with cake-cutting and service programmes such as Annadanam and blood donation.',
    descriptionTe: 'ఆంధ్రప్రదేశ్ ముఖ్యమంత్రి నారా చంద్రబాబు నాయుడు గారి పుట్టినరోజు వేడుకలు — టీడీపీ నాయకులు, కార్యకర్తల సంబరాలు, కేక్ కటింగ్, అన్నదానం, రక్తదానం వంటి సేవా కార్యక్రమాలు.',
    uploadDate: '2026-04-24T22:52:37-07:00',
    seconds: 37,
    vertical: true,
  },
  {
    id: 'QkwsQoqdtiY',
    slug: 'ugadi-greetings-2026',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Ugadi greetings, 2026',
    titleTe: 'శ్రీ పరాభవ నామ సంవత్సర ఉగాది శుభాకాంక్షలు',
    description: 'Greetings for Ugadi, the Telugu New Year — Sri Parabhava nama samvatsaram.',
    descriptionTe: 'తెలుగు ప్రజల ఆత్మీయ పండుగ ఉగాది — శ్రీ పరాభవ నామ సంవత్సర శుభాకాంక్షలు.',
    uploadDate: '2026-03-18T21:13:05-07:00',
    seconds: 42,
    vertical: true,
  },
  {
    id: 'KNbZUOwJzP4',
    slug: 'sworn-in-as-kanaka-durga-temple-board-member',
    group: 'channel',
    channel: 'haranna',
    kind: 'Video',
    title: 'Sworn in as a Kanaka Durga temple board member, Indrakeeladri, Vijayawada',
    titleTe: 'విజయవాడ ఇంద్రకీలాద్రి కనకదుర్గమ్మ ఆలయ బోర్డు సభ్యునిగా ప్రమాణ స్వీకారం',
    description: 'Talikota Hari Krishna takes the oath as a member of the trust board of the Sri Kanaka Durga Temple on Indrakeeladri hill, Vijayawada, followed by celebrations with devotees, leaders and supporters.',
    descriptionTe: 'విజయవాడ ఇంద్రకీలాద్రి శ్రీ కనకదుర్గమ్మ ఆలయ ధర్మకర్తల మండలి సభ్యునిగా తాళికోట హరికృష్ణ ప్రమాణ స్వీకారం, అనంతరం భక్తులు, నాయకులు, అభిమానుల సంబరాలు.',
    uploadDate: '2026-03-16T02:51:23-07:00',
    seconds: 53,
    vertical: false,
  },
  {
    id: 'rOQjRdVLI9A',
    slug: 'ntr-vardhanti-bike-rally-2026',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Bike rally marking N.T. Rama Rao’s Vardhanti',
    titleTe: 'ఎన్టీఆర్ వర్ధంతి సందర్భంగా బైక్ ర్యాలీ',
    description: 'Supporters and Telugu Desam Party workers hold a bike rally in tribute to the party’s founder N.T. Rama Rao on his death anniversary.',
    descriptionTe: 'పార్టీ వ్యవస్థాపకులు ఎన్.టి. రామారావు వర్ధంతి సందర్భంగా ఆయనకు నివాళిగా అభిమానులు, తెలుగుదేశం కార్యకర్తల బైక్ ర్యాలీ.',
    uploadDate: '2026-03-15T23:22:52-07:00',
    seconds: 52,
    vertical: true,
  },
  {
    id: 'PEO3fq4RMEg',
    slug: 'talikota-harikrishna-kanaka-durga-temple-board-member',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Talikota Harikrishna, Kanaka Durga temple board member',
    titleTe: 'కనకదుర్గ ఆలయ ధర్మకర్తల మండలి సభ్యులుగా తాళికోట హరికృష్ణ',
    description: 'A short video on Talikota Hari Krishna’s appointment to the trust board of the Sri Kanaka Durga Temple, Vijayawada.',
    descriptionTe: 'విజయవాడ శ్రీ కనకదుర్గ ఆలయ ధర్మకర్తల మండలి సభ్యునిగా తాళికోట హరికృష్ణ నియామకంపై షార్ట్ వీడియో.',
    uploadDate: '2025-10-15T06:30:39-07:00',
    seconds: 53,
    vertical: true,
  },
  {
    id: '-Pk8axazwkM',
    slug: 'mahanadu-kadapa-2025-delegate-registration',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'At Mahanadu, Kadapa — delegate registration',
    titleTe: 'కడప మహానాడు 2025 — ప్రతినిధుల నమోదు',
    description: 'Talikota Hari Krishna at the delegate registration of the three-day Telugu Desam Party Mahanadu in Kadapa, 2025.',
    descriptionTe: 'కడపలో జరిగిన మూడు రోజుల తెలుగుదేశం మహానాడు 2025 ప్రతినిధుల నమోదు కార్యక్రమంలో తాళికోట హరికృష్ణ.',
    uploadDate: '2025-06-08T04:08:28-07:00',
    seconds: 99,
    vertical: true,
  },
  {
    id: 'GmVHGytnKR4',
    slug: 'mahanadu-kadapa-2025',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'At Mahanadu, Kadapa, 2025',
    titleTe: 'కడప మహానాడు 2025లో తాళికోట హరికృష్ణ',
    description: 'Talikota Hari Krishna at the three-day Telugu Desam Party Mahanadu in Kadapa, 2025.',
    descriptionTe: 'కడపలో జరిగిన మూడు రోజుల తెలుగుదేశం మహానాడు 2025లో తాళికోట హరికృష్ణ.',
    uploadDate: '2025-05-30T00:09:17-07:00',
    seconds: 39,
    vertical: true,
  },
  {
    id: 'BUqFOCFnM5U',
    slug: 'with-the-people-for-the-people',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'With the people, for the people',
    titleTe: 'ప్రజలతో, ప్రజల కోసం',
    description: 'A short video on Talikota Hari Krishna’s public work with the Telugu Desam Party.',
    descriptionTe: 'తెలుగుదేశం పార్టీతో తాళికోట హరికృష్ణ ప్రజా కార్యక్రమాలపై షార్ట్ వీడియో.',
    uploadDate: '2025-05-12T05:30:19-07:00',
    seconds: 28,
    vertical: true,
  },
  {
    id: 'V1-aY34PF0A',
    slug: 'standing-tall-for-tdp',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Standing tall for TDP',
    titleTe: 'తెలుగుదేశం కోసం దృఢంగా',
    description: 'A short video on Talikota Hari Krishna and the Telugu Desam Party.',
    descriptionTe: 'తాళికోట హరికృష్ణ, తెలుగుదేశం పార్టీపై షార్ట్ వీడియో.',
    uploadDate: '2025-05-01T02:55:32-07:00',
    seconds: 32,
    vertical: true,
  },
  {
    id: '61vQTrGAMlI',
    slug: 'birthday-greetings-to-chandrababu-naidu-2025',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Birthday greetings to Chief Minister N. Chandrababu Naidu, 2025',
    titleTe: 'ముఖ్యమంత్రి నారా చంద్రబాబు నాయుడు గారికి జన్మదిన శుభాకాంక్షలు, 2025',
    description: 'Birthday greetings to Andhra Pradesh Chief Minister N. Chandrababu Naidu.',
    descriptionTe: 'ఆంధ్రప్రదేశ్ ముఖ్యమంత్రి నారా చంద్రబాబు నాయుడు గారికి జన్మదిన శుభాకాంక్షలు.',
    uploadDate: '2025-04-24T04:39:33-07:00',
    seconds: 114,
    vertical: true,
  },
  {
    id: 'iKSWrQ3bbqU',
    slug: 'tdp-43-years-formation-day-rally',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'Rally marking 43 years of the Telugu Desam Party',
    titleTe: 'తెలుగుదేశం పార్టీ 43 ఏళ్ల ఆవిర్భావ ర్యాలీ',
    description: 'A rally for the Telugu Desam Party’s formation day, 43 years after N.T. Rama Rao founded the party in 1982.',
    descriptionTe: '1982లో ఎన్.టి. రామారావు స్థాపించిన తెలుగుదేశం పార్టీ ఆవిర్భావానికి 43 ఏళ్లు — ఆవిర్భావ దినోత్సవ ర్యాలీ.',
    uploadDate: '2025-04-02T04:59:40-07:00',
    seconds: 41,
    vertical: true,
  },
  {
    id: 'ntCKNd2qDjk',
    slug: 'tdp-foundation-day-flexis-removed-ameerpet',
    group: 'channel',
    channel: 'haranna',
    kind: 'Short',
    title: 'On the removal of TDP Foundation Day flexis, Ameerpet',
    titleTe: 'అమీర్‌పేటలో టీడీపీ ఆవిర్భావ దినోత్సవ ఫ్లెక్సీల తొలగింపుపై',
    description: 'On TDP Foundation Day flexis taken down by GHMC staff at Ameerpet, Hyderabad, on Ugadi — the day after the party’s Foundation Day.',
    descriptionTe: 'తెలుగుదేశం ఆవిర్భావ దినోత్సవం మరుసటి రోజు, ఉగాది నాడు, హైదరాబాద్ అమీర్‌పేటలో పార్టీ ఫ్లెక్సీలను జీహెచ్ఎంసీ సిబ్బంది తొలగించడంపై.',
    uploadDate: '2025-03-30T21:04:43-07:00',
    seconds: 62,
    vertical: true,
  },
]

/** Interviews and news reports from TV channels. */
export const interviewVideos = allVideos.filter((v) => v.group === 'interview')

/** Team Haranna's videos. */
export const videos = allVideos.filter((v) => v.group === 'channel')

export const videoBySlug = (slug) => allVideos.find((v) => v.slug === slug) || null
export const videoPath = (v) => `/videos/${v.slug}`
export const videoThumb = (v) => `/photos/video/${v.id}.webp`
export const videoImage = (v) => `/photos/video/${v.id}.jpg`
/** youtube-nocookie: no cookies until the visitor presses play. */
export const videoEmbed = (v) => `https://www.youtube-nocookie.com/embed/${v.id}?rel=0`
export const videoWatchUrl = (v) => `https://www.youtube.com/watch?v=${v.id}`

/** ISO 8601 duration for structured data: 426 -> "PT7M6S". */
export const isoDuration = (s) => `PT${Math.floor(s / 60) ? `${Math.floor(s / 60)}M` : ''}${s % 60}S`

/** The day a video went up, in the page's language. */
export const formatVideoDate = (iso, lang = 'en') =>
  new Date(iso).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/** 426 -> "7:06" */
export const formatLength = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
