/**
 * Single source of truth for all site content.
 *
 * Everything here is traceable to website-content-master.md. If a fact isn't in
 * that document or verifiable from a public source, it does not belong here.
 * Notably absent, on purpose:
 *   - visitor/impact statistics  (never published; previously invented)
 *   - follower counts            (never published; previously invented)
 *   - dated "recent updates"     (never published; previously invented)
 * Fields marked TODO need a real value from the office before launch.
 */

export const site = {
  name: 'Talikota Hari Krishna',
  shortName: 'HK Talikota',
  alternateNames: ['Talikota Harikrishna', 'Hari Krishna Talikota', 'Harikrishna Talikota', 'Hari TDP', 'Haranna'],
  role: 'Board Member, Sri Durga Malleswara Swamy Varla Devasthanam',
  // Names the temple, not just the category. "Devasthanam Board Member" was the
  // root of the problem the office raised: there are many Devasthanam board
  // members across the two Telugu states, so the phrase identifies nobody. This
  // is the shortest form that still says which institution.
  roleShort: 'Board Member, Sri Kanaka Durga Devasthanam',
  secondaryRole: 'iTDP Telangana State President',

  // TODO(office): confirm the production domain before launch. Every canonical
  // URL, the sitemap and the social preview tags are derived from this.
  url: 'https://www.talikotaharikrishna.com',

  tagline: 'Serving Telangana with Dedication',
  description:
    'Talikota Hari Krishna — Board Member, Sri Kanaka Durga Devasthanam, Indrakeeladri, Vijayawada, and iTDP Telangana State President, Telugu Desam Party.',

  mission:
    'Working on regional development, good governance and Telugu cultural preservation in Telangana and Andhra Pradesh, through party organisation and temple service.',

  location: {
    locality: 'Hyderabad',
    region: 'Telangana',
    regionCode: 'IN-TG',
    country: 'India',
    countryCode: 'IN',
    lat: 17.385044,
    lng: 78.486671,
  },
}

/**
 * The two offices he holds, in the order the site presents them.
 *
 * The Devasthanam seat leads. It is the more widely recognised of the two —
 * the Kanaka Durga temple at Indrakeeladri draws millions of devotees a year
 * and is searched for by name constantly, whereas a state party-wing
 * presidency is a niche query. Leading with it is both accurate to the
 * standing of the role and the better route to reach.
 *
 * Stated exactly as held: Board Member, one of several trustees — not
 * chairman, and not an executive officer of the temple.
 */
export const roles = [
  {
    title: 'Board Member',
    org: 'Sri Durga Malleswara Swamy Varla Devasthanam (Sri Kanaka Durga Temple), Indrakeeladri, Vijayawada',
    href: '/community',
  },
  {
    title: 'iTDP Telangana State President',
    org: 'Telugu Desam Party',
    href: '/political',
  },
]

/**
 * TODO(office): these are placeholders. The source document lists them as
 * "[to be provided]". `verified: false` keeps them out of the rendered UI and
 * out of the structured data — flip to true once real values are supplied.
 */
export const contact = {
  email: { value: 'contact@www.talikotaharikrishna.com', verified: false },
  press: { value: 'press@www.talikotaharikrishna.com', verified: false },
  phone: { value: '', display: '', verified: false },
  office: { value: 'Hyderabad, Telangana, India', verified: true },
  hours: { value: '', verified: false },
}

/**
 * Accounts, with `official` saying whether the office runs it.
 *
 * The distinction is not decoration. Team Haranna is a supporter-run channel;
 * listing it beside the office's own accounts under one heading would assert
 * that it speaks for him, which it does not. Anything marked official:false is
 * labelled as such wherever it appears.
 */
export const social = [
  {
    name: 'Instagram',
    handle: '@hari_krishna_talikota',
    url: 'https://www.instagram.com/hari_krishna_talikota/',
    official: true,
  },
  {
    name: 'Facebook',
    handle: 'Talikota Harikrishna',
    url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/',
    official: true,
  },
  {
    name: 'X',
    handle: '@THK_iTDP',
    url: 'https://x.com/THK_iTDP',
    official: true,
  },
  {
    name: 'YouTube',
    handle: '@TeamHaranna',
    url: 'https://www.youtube.com/@TeamHaranna',
    official: false,
    note: 'Supporter-run channel',
  },
]

/**
 * X accounts worth following alongside his own — his, and the party's.
 * Rendered as links rather than an embedded timeline: X's widget returns an
 * empty frame for an account with no posts, which is a broken-looking box
 * rather than a feed.
 */
export const xAccounts = [
  {
    name: 'Talikota Hari Krishna',
    handle: '@THK_iTDP',
    url: 'https://x.com/THK_iTDP',
    description: 'His own account',
  },
  {
    name: 'Telugu Desam Party',
    handle: '@JaiTDP',
    url: 'https://x.com/JaiTDP',
    description: 'The party’s national account',
  },
]

export const party = {
  name: 'Telugu Desam Party',
  // How the office wants the Telangana unit written wherever his own office is
  // named alongside it. `name` stays the party's plain legal name because that
  // is what the schema.org PoliticalParty entity has to carry.
  telanganaUnit: 'Telugu Desam Party Telangana',
  abbr: 'TDP',
  founded: 'March 29, 1982',
  foundedISO: '1982-03-29',
  founder: 'Nandamuri Taraka Rama Rao (NTR)',
  nationalPresident: 'N. Chandrababu Naidu',
  workingPresident: 'Nara Lokesh',
  symbol: 'Bicycle',
  colors: 'Yellow and Green',
  url: 'https://www.telugudesam.org',
  heritage:
    'The Telugu Desam Party was founded in 1982 by the actor and later Chief Minister N.T. Rama Rao (NTR), on a platform of Telugu self-respect and regional development. Under the current leadership of N. Chandrababu Naidu, the party continues to champion development-oriented governance and technological innovation.',
  principles: [
    'Telugu cultural identity and pride',
    'Economic development and industrialisation',
    'Good governance and transparency',
    'Social welfare and inclusive growth',
    'Technology-driven administration',
    'Infrastructure development',
  ],
}

export const biography = {
  intro:
    'Talikota Hari Krishna is a dedicated political leader and community servant who has committed his life to advancing the interests of the Telugu people. As the iTDP Telangana State President, he leads the Telugu Desam Party’s efforts in Telangana, working to promote development, good governance, and Telugu cultural pride.',
  journey:
    'As the iTDP Telangana State President, Hari Krishna represents the Telugu Desam Party’s vision in Telangana. He is committed to the party’s founding principles, set out by its founder N.T. Rama Rao — Telugu pride, regional development, and good governance. His political work focuses on creating economic opportunities, improving infrastructure, and ensuring that the voices of Telangana’s citizens are heard at all levels of government.',
  community:
    'He serves on the trust board of the Sri Durga Malleswara Swamy Varla Devasthanam at Indrakeeladri, Vijayawada — the Sri Kanaka Durga Temple, one of the most visited Devi temples in South India, which receives millions of pilgrims a year. The Devasthanam is administered by a trust board under the Andhra Pradesh Endowments Department; the role covers governance, financial oversight and devotee services. He is one of several board members, not the chairman.',
  vision:
    'Hari Krishna envisions a Telangana that honours its rich Telugu heritage while embracing modern development. His focus is on creating economic opportunities for youth, improving infrastructure, ensuring good governance, and preserving the cultural identity that makes Telangana unique.',
}

export const responsibilities = [
  'Leading iTDP operations in Telangana State',
  'Building party organisation and membership',
  'Coordinating with national leadership',
  'Representing party interests in Telangana',
  'Engaging with constituents and voters',
  'Media relations and public communication',
  'Election strategy and campaign management',
]

export const values = [
  {
    icon: 'gavel',
    title: 'Integrity in Public Service',
    description:
      'Maintaining the highest standards of honesty and ethical conduct in all political activities.',
  },
  {
    icon: 'users',
    title: 'Service to Community',
    description:
      'Taking up constituents’ concerns and following them through with the relevant departments.',
  },
  {
    icon: 'handshake',
    title: 'Transparency & Accountability',
    description: 'Open communication and taking responsibility for all actions and decisions.',
  },
  {
    icon: 'heart',
    title: 'Cultural Preservation',
    description: 'Protecting and promoting Telugu language, culture, and heritage.',
  },
  {
    icon: 'chart',
    title: 'Development & Progress',
    description: 'Driving economic growth and infrastructure development for a better future.',
  },
  {
    icon: 'award',
    title: 'Good Governance',
    description: 'Ensuring efficient, transparent, and citizen-centric administration.',
  },
]

export const focusAreas = [
  {
    slug: 'economic-development',
    icon: 'chart',
    title: 'Economic Development',
    summary:
      'Promoting industrial growth and creating employment opportunities for the youth of Telangana.',
    points: [
      'Promoting industrial growth in Telangana',
      'Creating employment opportunities for youth',
      'Supporting small and medium enterprises',
      'Attracting investments to the state',
      'Entrepreneurship development programmes',
    ],
  },
  {
    slug: 'infrastructure',
    icon: 'road',
    title: 'Infrastructure Development',
    summary:
      'Building the roads, utilities and urban systems a growing Telangana depends on.',
    points: [
      'Improving road and transportation networks',
      'Enhancing urban infrastructure',
      'Rural development initiatives',
      'Water resource management',
      'Smart city development',
    ],
  },
  {
    slug: 'social-welfare',
    icon: 'graduation',
    title: 'Social Welfare',
    summary:
      'Supporting education, healthcare, and empowerment programmes for all communities.',
    points: [
      'Education and skill development programmes',
      'Healthcare accessibility and quality',
      'Support for farmers and agricultural workers',
      'Women’s empowerment initiatives',
      'Youth development programmes',
    ],
  },
  {
    slug: 'good-governance',
    icon: 'balance',
    title: 'Good Governance',
    summary:
      'Ensuring transparency, accountability, and citizen-centric services in administration.',
    points: [
      'Transparency in administration',
      'Accountability of public officials',
      'Citizen-centric services',
      'Anti-corruption measures',
      'Efficient government operations',
    ],
  },
  {
    slug: 'telugu-pride',
    icon: 'leaf',
    title: 'Telugu Cultural Pride',
    summary: 'Preserving Telugu language, culture, and heritage while embracing progress.',
    points: [
      'Preservation of Telugu language and culture',
      'Support for arts and literature',
      'Cultural festivals and celebrations',
      'Heritage conservation',
      'Promotion of Telugu identity',
    ],
  },
  {
    slug: 'community-engagement',
    icon: 'users',
    title: 'Community Engagement',
    summary: 'Staying accessible to the people who put their trust in the movement.',
    points: [
      'Regular constituent meetings',
      'Public forums and town halls',
      'Grassroots organisation building',
      'Volunteer mobilisation',
      'Youth and women leadership programmes',
    ],
  },
]

export const temple = {
  officialName: 'Sri Durga Malleswara Swamy Varla Devasthanam',
  popularName: 'Sri Kanaka Durga Temple',
  deity: 'Goddess Kanaka Durga',
  location: 'Indrakeeladri Hill, Vijayawada, Andhra Pradesh',
  river: 'Krishna River',
  significance:
    'Located on the Indrakeeladri Hill on the banks of the Krishna River in Vijayawada, Andhra Pradesh, the Kanaka Durga Temple is dedicated to Goddess Kanaka Durga. The temple attracts millions of devotees annually and is best known for its Dasara Navaratri festival.',
  history:
    'The temple has a history spanning centuries and is widely revered as a Shakti Peetha. It plays a central role in the spiritual and cultural life of the Telugu people.',
  intro:
    'Talikota Hari Krishna serves on the trust board of the Sri Durga Malleswara Swamy Varla Devasthanam — the Sri Kanaka Durga Temple on Indrakeeladri hill, Vijayawada, one of the most visited Devi temples in South India. He is one of several board members, not the chairman. The role covers temple administration, financial oversight, devotee services and the upkeep of tradition.',
  duties: [
    {
      title: 'Temple Administration',
      points: [
        'Overseeing day-to-day temple operations',
        'Ensuring quality of devotee services',
        'Managing temple staff and resources',
        'Maintaining temple facilities and infrastructure',
      ],
    },
    {
      title: 'Financial Stewardship',
      points: [
        'Transparent management of temple funds',
        'Proper utilisation of donations',
        'Financial planning and budgeting',
        'Audit and accountability',
      ],
    },
    {
      title: 'Devotee Services',
      points: [
        'Improving darshan facilities',
        'Accommodation for pilgrims',
        'Food services (Annadanam)',
        'Special services for elderly and differently-abled devotees',
      ],
    },
    {
      title: 'Cultural Preservation',
      points: [
        'Maintaining traditional rituals and ceremonies',
        'Supporting temple festivals and celebrations',
        'Preserving temple heritage and architecture',
        'Promoting religious education',
      ],
    },
  ],
  festivals: [
    { name: 'Sharad Navaratri', note: 'The temple’s largest observance — nine nights of the goddess in the autumn, drawing the year’s heaviest footfall.' },
    { name: 'Vasantha Navaratri', note: 'The spring Navaratri, observed with a full cycle of alankarams and special poojas.' },
    { name: 'Ugadi', note: 'The Telugu New Year, marked at the temple with panchanga sravanam and festival darshan.' },
    { name: 'Daily rituals & special poojas', note: 'The regular ritual calendar that runs through the year, alongside sponsored sevas.' },
  ],

  /** Devotee-facing services the board oversees. */
  services: [
    { name: 'Darshan', note: 'Daily darshan for general and sponsored queues, including arrangements at peak festival times.' },
    { name: 'Annadanam', note: 'Free meals served to devotees — among the most visible of the temple’s charitable functions.' },
    { name: 'Accommodation', note: 'Lodging for pilgrims travelling from across the Telugu states and beyond.' },
    { name: 'Online booking', note: 'Digital booking for darshan, sevas and accommodation.' },
    { name: 'Assisted access', note: 'Provision for elderly and differently-abled devotees.' },
  ],

  governance:
    'The Devasthanam is administered by a trust board under the oversight of the Andhra Pradesh Endowments Department, with professional management handling day-to-day operations. Board members carry responsibility for administration, transparent use of temple funds, the quality of devotee services, and the continuity of ritual tradition. Talikota Hari Krishna sits on this board as one of its members — not as its chairman, and not as an executive officer of the temple.',
}

/**
 * Press releases and event announcements, newest first.
 *
 * Deliberately empty. The previous build shipped four invented events with
 * specific dates attached to a sitting party president. An empty newsroom is
 * honest; a fabricated one is a liability. Add real entries as:
 *   { date: '2026-05-08', title: '...', summary: '...', href: '...' }
 */
export const updates = []

/**
 * Frequently asked questions, rendered on /about and emitted as FAQPage
 * structured data.
 *
 * This block exists for GEO (generative engine optimisation) as much as for
 * readers: AI answer engines consume explicit question/answer pairs directly,
 * so stating plainly "who is he / what party / what temple role" is what lets
 * an assistant answer accurately instead of guessing or conflating him with
 * someone else of a similar name.
 *
 * Every answer is traceable to website-content-master.md. Do not add a question
 * whose answer cannot be sourced.
 */
export const faqs = [
  {
    q: 'Who is Talikota Hari Krishna?',
    a: 'Talikota Hari Krishna is an Indian politician who serves as the iTDP Telangana State President of the Telugu Desam Party (TDP). He is also a Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam at Indrakeeladri, Vijayawada. He is based in Hyderabad, Telangana, and is also known as Talikota Harikrishna.',
  },
  {
    q: 'Which political party does Talikota Hari Krishna belong to?',
    a: 'He belongs to the Telugu Desam Party (TDP), founded in 1982 by N.T. Rama Rao and led nationally by N. Chandrababu Naidu, with Nara Lokesh as National Working President. Talikota Hari Krishna serves as the party’s iTDP Telangana State President.',
  },
  {
    q: 'What is his role at the Sri Kanaka Durga temple?',
    a: 'He serves as a Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam — popularly the Sri Kanaka Durga Temple — on Indrakeeladri Hill in Vijayawada, Andhra Pradesh. The role covers temple administration, financial stewardship, devotee services and the preservation of temple tradition.',
  },
  {
    q: 'What are Talikota Hari Krishna’s political focus areas?',
    a: 'His stated focus areas are economic development and employment for youth, infrastructure development, social welfare including education and healthcare, good governance and transparency, Telugu cultural preservation, and direct community engagement across Telangana.',
  },
  {
    q: 'Where is Talikota Hari Krishna based?',
    a: 'His base of operations is Hyderabad, Telangana, India. His political work covers Telangana state, and his temple board service is in Vijayawada, Andhra Pradesh.',
  },
  {
    q: 'How can I contact Talikota Hari Krishna?',
    a: 'You can reach the office through the contact page on this website, or follow the official social media accounts — Instagram (@hari_krishna_talikota), Facebook (Talikota Harikrishna) and X (@THK_iTDP). The Team Haranna YouTube channel carries video coverage but is run by supporters, not by the office.',
  },
]

/**
 * Notable political activity, newest first.
 *
 * SOURCING RULE: the `event` and its `coverage` must be independently
 * verifiable. His own role is stated as the office's own account — normal for
 * a first-party site — and must never be dressed up as press reporting.
 * Anything unverified stays out until the office confirms it.
 */
/**
 * The trust board, and the public record behind the seat.
 *
 * WHY THIS EXISTS
 * The site asserted the board role on six pages and gave a reader no way to
 * check any of it -- no board, no date, no appointing authority, no chairman, no
 * citation. "Devasthanam Board Member" identifies nobody on its own: there are
 * hundreds of Devasthanam trustees across the two Telugu states. This is the
 * record behind the claim, and it is what the office asked for.
 *
 * WHAT THE CITATIONS ESTABLISH
 * That the Andhra Pradesh government constituted a new trust board for this
 * Devasthanam in September 2025; that it was sworn in before the Rajagopuram on
 * Indrakeeladri on 11 October 2025; that Borra Radhakrishna (Gandhi) chairs it
 * and seventeen members sit alongside him; and that the nominated list records a
 * member as "Harikrishna -- Hyderabad -- TDP Telangana". The Hans India of
 * 22 March 2026 names "T Harikrishna" among the members attending a temple
 * programme, with the chairman listed separately.
 *
 * WHAT THEY DO NOT ESTABLISH -- read before adding more.
 * No published report found spells the surname "Talikota" beside the temple
 * seat. The identification rests on the government list's own tag (Hyderabad,
 * TDP Telangana, a member rather than the chairman) and on the "T" initial.
 * That is strong; it is not a printed surname. So the sources below are
 * presented as the record OF THE BOARD -- which is exactly what they are -- and
 * never captioned as proof of identity.
 *
 * The single document that would settle it is the Endowments Department G.O.
 * constituting this board, which carries full legal names. It is not online.
 * When the office supplies it, put it first in `sources`.
 *
 * NOT CLAIMED ANYWHERE: that he chairs the board. He does not. Borra
 * Radhakrishna does, and the site says so in as many words -- which is also why
 * a reader can tell the two apart.
 */
export const templeBoard = {
  seat: 'Member of the trust board — one of several members, not the chairman',
  chairman: 'Borra Radhakrishna (Gandhi)',
  sworn: '11 October 2025',
  swornPlace: 'Before the Rajagopuram, Indrakeeladri, Vijayawada',
  authority: 'Andhra Pradesh Endowments Department',

  facts: [
    ['Institution', 'Sri Durga Malleswara Swamy Varla Devasthanam'],
    ['Temple', 'Sri Kanaka Durga Temple, Indrakeeladri hill, Vijayawada'],
    ['Governing body', 'Non-hereditary trust board, Andhra Pradesh Endowments Department'],
    ['Board chairman', 'Borra Radhakrishna (Gandhi) — not Talikota Hari Krishna'],
    ['His seat', 'Trust board member, one of seventeen alongside the chairman'],
    ['Sworn in', '11 October 2025, before the Rajagopuram on Indrakeeladri'],
  ],

  /*
   * Devotee numbers from the Endowments Minister, not from temple publicity.
   * The site used to say "millions", which is true and says nothing.
   */
  footfall: {
    value: '119.34 lakh devotees in 2025-26, up from 93.40 lakh in 2023-24',
    attribution: 'Figures given by the Andhra Pradesh Endowments Minister',
    url: 'https://www.deccanchronicle.com/lifestyle/culture-and-society/temple-revenue-devotee-footfall-record-strong-growth-minister-1969409',
  },

  sources: [
    {
      label: 'Deccan Chronicle',
      title: 'New members of Kanakadurga temple trust board sworn in',
      date: '11 October 2025',
      url: 'https://www.deccanchronicle.com/southern-states/andhra-pradesh/new-members-of-kanakadurga-temple-trust-board-sworn-in-1909523',
    },
    {
      label: 'The Hans India',
      title: 'Radhakrishna is new chairman of Durga temple board',
      date: 'September 2025',
      url: 'https://www.thehansindia.com/andhra-pradesh/radhakrishna-is-new-chairman-of-durga-temple-board-1010381',
    },
    {
      label: 'NTV Telugu',
      title: 'దుర్గ గుడి ఆలయ బోర్డు సభ్యులుగా 16 మంది నియామకం.. లిస్ట్ ఇదే!',
      date: 'September 2025',
      url: 'https://ntvtelugu.com/news/vijayawada-durga-temple-board-16-new-members-appointed-full-list-869264.html',
    },
    {
      label: 'The Hans India',
      title: 'Devotees first at Durga temple, says commissioner',
      date: '22 March 2026',
      url: 'https://www.thehansindia.com/andhra-pradesh/devotees-first-at-durga-temple-says-commissioner-1058511',
    },
  ],
}

export const campaigns = [
  {
    slug: 'wipro-circle-protest',
    date: '2023-09',
    dateLabel: 'September 2023',
    title: 'IT professionals’ protest at Wipro Circle',
    place: 'Gachibowli, Hyderabad',
    summary:
      'After the arrest of TDP National President N. Chandrababu Naidu in the Skill Development case, IT professionals gathered at Wipro Circle in Gachibowli to demand his release. The demonstration was mobilised through the party’s professional and IT wing and drew employees from across Hyderabad’s IT corridor, with protesters holding “I Stand With CBN” placards. Police moved in and dispersed the gathering.',
    role:
      'Talikota Hari Krishna led the iTDP Telangana mobilisation for the Wipro Circle demonstration, organising the turnout of IT-sector party workers across the corridor.',
    coverage: [
      { outlet: 'V6 News', title: 'TDP IT Wing Employees Protest Over Chandra Babu Arrest At Wipro Circle', url: 'https://www.youtube.com/watch?v=pikT5aJJy7I' },
      { outlet: 'Deccan Chronicle', title: 'IT staff protest Naidu’s arrest in Hyderabad', url: 'https://www.deccanchronicle.com/nation/in-other-news/140923/it-staff-protest-naidus-arrest-in-hyderabad.html' },
      { outlet: 'The News Minute', title: 'Techies associated with TDP protest against Chandrababu’s arrest in Hyderabad', url: 'https://www.thenewsminute.com/andhra-pradesh/techies-associated-with-tdp-protest-against-chandrababus-arrest-in-hyderabad' },
      { outlet: 'The Hans India', title: 'Global city’s techies take to streets over Naidu’s arrest', url: 'https://www.thehansindia.com/news/cities/hyderabad/hyderabad-global-citys-techies-take-to-streets-over-naidus-arrest-822520' },
      // Eenadu's photo report names the route explicitly — Wipro Circle to the
      // Outer Ring Road — which is the detail that ties this coverage to the
      // location, in the largest-circulation Telugu daily.
      { outlet: 'Eenadu', title: 'చంద్రబాబు అరెస్టుకు నిరసనగా ఐటీ ఉద్యోగుల ఆందోళన (IT employees’ protest rally, Hyderabad)', url: 'https://www.eenadu.net/photos/playimages/it-employees-protest-rally-in-hyderabad/1/11735' },
    ],
  },
]

export const subjectOptions = [
  'Political Inquiry',
  'Media Request',
  'Constituent Service',
  'Join TDP',
  'Volunteer',
  'Event Invitation',
  'General Inquiry',
]

export const nav = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Political Leadership', path: '/political' },
  { name: 'Community Service', path: '/community' },
  { name: 'Media', path: '/media' },
  { name: 'Contact', path: '/contact' },
]
