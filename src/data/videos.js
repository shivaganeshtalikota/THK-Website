/**
 * Videos from the official channel, youtube.com/@TeamHaranna.
 *
 * Pulled from the channel's public Atom feed
 * (youtube.com/feeds/videos.xml?channel_id=UCGGggwMXVxhNY9q9CZ6325Q), so every
 * entry is first-party and verifiable by opening the channel.
 *
 * Titles are rewritten in plain English. The feed titles are hashtag-stuffed —
 * normal on YouTube, spam-looking on a website — and the original Telugu is
 * preserved separately where the video was titled in Telugu.
 *
 * `published` is the upload date, not necessarily the event date. Do not
 * present it as the date the event happened unless the title says so.
 *
 * Thumbnails are downloaded to public/photos/video/<id>.webp rather than
 * hotlinked from i.ytimg.com: it keeps the page working where YouTube is
 * blocked, removes a third-party request from every page view, and lets the
 * Content-Security-Policy stay img-src 'self'.
 *
 * Refresh: re-read the feed and re-download thumbnails; no API key involved.
 */
export const channel = {
  handle: '@TeamHaranna',
  name: 'Team Haranna',
  id: 'UCGGggwMXVxhNY9q9CZ6325Q',
  url: 'https://www.youtube.com/@TeamHaranna',
}

export const videos = [
  {
    id: 't_26uwmonIA',
    title: "Saree offering to Sri Kanaka Durga Ammavaru",
    telugu: "శ్రీ కనకదుర్గ అమ్మవారి సారే సమర్పణ",
    published: '2026-08-10',
  },
  {
    id: '08ZalRdw2b0',
    title: "Welcoming the saree offering for Sri Kanaka Durga Ammavaru, Hyderabad Bonalu",
    telugu: "శ్రీ విజయవాడ కనకదుర్గ అమ్మవారి సారే సమర్పణకు ఘన స్వాగతం",
    published: '2026-08-08',
  },
  {
    id: '9J7qTrF9w2Y',
    title: "Talikota Harikrishna — Telugu Desam Party",
    published: '2026-08-05',
  },
  {
    id: '2RI8IEb9rlU',
    title: "Chandrababu Naidu birthday celebrations",
    telugu: "చంద్రబాబు నాయుడు గారి పుట్టినరోజు వేడుకలు ఘనంగా",
    published: '2026-04-25',
  },
  {
    id: 'QkwsQoqdtiY',
    title: "Ugadi greetings",
    telugu: "శ్రీ పరాభవ నామ సంవత్సర ఉగాది శుభాకాంక్షలు",
    published: '2026-03-19',
  },
  {
    id: 'KNbZUOwJzP4',
    title: "Oath-taking as a board member of the Indrakeeladri Kanaka Durgamma temple, Vijayawada",
    telugu: "విజయవాడ ఇంద్రకీలాద్రి కనకదుర్గమ్మ ఆలయ బోర్డు సభ్యునిగా ప్రమాణ స్వీకారం",
    published: '2026-03-16',
  },
  {
    id: 'rOQjRdVLI9A',
    title: "Bike rally marking N.T. Rama Rao’s Vardhanti",
    telugu: "ఎన్టీఆర్ వర్ధంతి సందర్భంగా ఘనంగా బైక్ ర్యాలీ",
    published: '2026-03-16',
  },
  {
    id: 'PEO3fq4RMEg',
    title: "Talikota Harikrishna as Kanaka Durga temple board member",
    published: '2025-10-15',
  },
  {
    id: '-Pk8axazwkM',
    title: "At Mahanadu, Kadapa — delegate registration",
    published: '2025-06-08',
  },
  {
    id: 'GmVHGytnKR4',
    title: "At Mahanadu, Kadapa",
    published: '2025-05-30',
  },
  {
    id: 'BUqFOCFnM5U',
    title: "With the people, for the people",
    published: '2025-05-12',
  },
  {
    id: 'V1-aY34PF0A',
    title: "Standing tall for TDP",
    published: '2025-05-01',
  },
  {
    id: '61vQTrGAMlI',
    title: "Birthday greetings to AP Chief Minister Nara Chandrababu Naidu",
    published: '2025-04-24',
  },
  {
    id: 'iKSWrQ3bbqU',
    title: "Rally marking 43 years of the Telugu Desam Party",
    published: '2025-04-02',
  },
  {
    id: 'ntCKNd2qDjk',
    title: "On the removal of the TDP Foundation Day flexi",
    published: '2025-03-31',
  },
]
