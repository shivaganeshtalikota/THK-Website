/**
 * Event albums — one event, many frames, kept together.
 *
 * WHY THIS IS NOT THE GALLERY
 * The gallery holds one representative frame per occasion. An album is the
 * opposite case: a single event the office photographed a dozen times over.
 * Dropping those into the gallery as separate entries would bury every other
 * occasion behind one afternoon and tell the reader nothing — the set means
 * something as a set, which is how the party's own page published it.
 *
 * SOURCING
 * `telugu` is the Telangana TDP page's own wording, quoted rather than
 * paraphrased. It is the party's account of its own event, which makes it a
 * better record than anything written here, and it is what a Telugu reader
 * searching for the rally will actually have seen. `summary` is an English
 * rendering of it for readers who do not have Telugu.
 *
 * `sources` carries the post itself. Every claim on the page — the route, the
 * tribute at the statue, the names of who attended — comes from there and is
 * checkable in one click. Nothing is asserted beyond what the source states.
 */
export const albums = [
  {
    slug: 'ntr-vardhanti-bike-rally',
    group: 'party',

    title: 'Bike rally on the 30th Vardhanti of N.T. Rama Rao',
    teluguTitle: 'ఎన్టీఆర్ 30వ వర్ధంతి సందర్భంగా బైక్ ర్యాలీ',

    /*
     * N.T. Rama Rao died on 18 January 1996, so his thirtieth Vardhanti falls
     * on 18 January 2026. The date is derived from the anniversary the source
     * names rather than read off the post, whose own timestamp was not legible
     * in the copy supplied — flagged to the office to confirm.
     */
    date: '2026-01-18',
    dateLabel: 'January 2026',
    place: 'Nagaram to NTR Ghat, Hyderabad',

    summary:
      'On the 30th Vardhanti of N.T. Rama Rao, a bike rally was held from Nagaram to NTR Ghat under the leadership of Talikota Hari Krishna. Tributes were first offered at the NTR statue in Nagaram, after which the rally set out with Telugu Desam Party leaders and workers. Party ranks attended in large numbers.',

    remarks:
      'Speaking at the event, Talikota Hari Krishna said N.T. Rama Rao’s service to the undivided state of Andhra Pradesh is unforgettable, and that the welfare of the poor, the dignity of women and the self-respect of the people were the mark of his administration. He said carrying N.T. Rama Rao’s ideals forward is the Telugu Desam Party’s purpose.',

    // Quoted from the Telangana TDP page, unaltered.
    telugu:
      'అన్న నందమూరి తారక రామారావు గారి 30వ వర్ధంతి సందర్భంగా తాలికోట హరికృష్ణ గారి ఆధ్వర్యంలో నాగారం నుంచి ఎన్టీఆర్ ఘాట్ వరకు ఘనంగా బైక్ ర్యాలీ నిర్వహించారు. నాగారం లోని ఎన్టీఆర్ విగ్రహానికి ముందుగా నివాళులు అర్పించిన అనంతరం, తెలుగుదేశం పార్టీ నాయకులు, కార్యకర్తలతో కలిసి బైక్ ర్యాలీ చేపట్టారు. ఈ ర్యాలీకి పెద్ద సంఖ్యలో పార్టీ శ్రేణులు హాజరయ్యారు.',

    teluguRemarks:
      'ఈ సందర్భంగా తాలికోట హరికృష్ణ గారు మాట్లాడుతూ, ఉమ్మడి ఆంధ్రప్రదేశ్ రాష్ట్రానికి ఎన్టీఆర్ గారు చేసిన సేవలు చిరస్మరణీయమని, పేదల సంక్షేమం, మహిళల గౌరవం, ప్రజల ఆత్మగౌరవమే ఆయన పాలనకు నిదర్శనమని పేర్కొన్నారు. ఎన్టీఆర్ గారి ఆశయాలను ముందుకు తీసుకెళ్లడమే తెలుగుదేశం పార్టీ లక్ష్యమని అన్నారు.',

    // Named in the source post, in the order it names them.
    attended: [
      'Uma Shankar',
      'Balasubrahmanyam',
      'Sai Nagarjuna',
      'Mellam Srinivas',
      'Bazaar Hemanth Goud',
      'Brahmam Chowdary',
      'Balakrishna Goud',
    ],

    sources: [
      {
        label: 'Telangana Telugu Desam Party',
        url: 'https://www.facebook.com/TelanganaTDPparty/posts/pfbid02gULCPu94KtcpNDJnwyYSdopfwxeB6sNCRZ2irzXtXnvYThyovNgwr3fuCb2kCcXfl',
      },
    ],

    /*
     * Per-frame alt text, written from the photographs rather than generated.
     * A crawler and a screen reader both get a real description of what is in
     * each frame; "photo 4 of 10" would give neither anything.
     */
    frames: [
      { n: 1, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'Riders in Telugu Desam Party yellow carrying party flags at the head of the rally, one rider with an arm raised' },
      { n: 2, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'The rally moving along a city road past parked vehicles, flags carried from the pillion' },
      { n: 3, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'Riders beneath roadside trees with Telugu Desam Party flags raised' },
      { n: 4, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'The column riding along a divided carriageway, flags along its length' },
      { n: 5, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'The rally passing beneath the metro viaduct on a wide open road' },
      { n: 6, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'Riders passing under the metro rail bridge, the column stretching back down the road' },
      { n: 7, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'The rally passing a metro station, flags held high above the riders' },
      { n: 8, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'The column in formation beneath the metro viaduct' },
      { n: 9, w: 1600, h: 1066, widths: [480, 768, 1200, 1600], alt: 'A dense line of riders close to the camera, party flags above them' },
      { n: 10, w: 1402, h: 940, widths: [480, 768, 1200, 1402], alt: 'Party leaders and workers gathered at the NTR Ghat memorial in Hyderabad at the end of the rally' },
    ],
  },
]


/**
 * Each album's frames in the shape <Picture> expects, so an album photograph
 * renders through exactly the same responsive path as a gallery photograph.
 * The 10th frame of this rally is the only 1402px original, so its ladder stops
 * one step short — handled by filtering rather than by a special case.
 */
export const albumFrames = (album) =>
  album.frames.map((f) => {
    const slug = `${album.slug}-${String(f.n).padStart(2, '0')}`
    return {
      slug,
      alt: f.alt,
      // The viewer reads `caption`, the grid reads `alt`. They are the same
      // sentence here: it was written to describe the frame, which is what
      // both surfaces want, so there is nothing to gain from a second one.
      caption: f.alt,
      sources: album.sources,
      src: `/photos/${slug}.jpg`,
      width: f.w,
      height: f.h,
      widths: f.widths,
      focus: '50% 50%',
    }
  })
