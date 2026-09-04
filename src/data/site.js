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
  name: 'Hari Krishna Talikota',
  shortName: 'HK Talikota',
  alternateNames: ['Talikota Harikrishna', 'Hari TDP', 'Haranna'],
  role: 'iTDP Telangana State President',
  roleShort: 'iTDP Telangana President',
  secondaryRole: 'Board Member, Sri Kanaka Durga Devasthanam',

  // TODO(office): confirm the production domain before launch. Every canonical
  // URL, the sitemap and the social preview tags are derived from this.
  url: 'https://harikrishnatalikota.com',

  tagline: 'Serving Telangana with Dedication',
  description:
    'Official website of Hari Krishna Talikota, iTDP Telangana State President and Board Member of Sri Kanaka Durga Devasthanam. Dedicated to Telugu pride, regional development, and good governance in Telangana.',

  mission:
    'Dedicated to advancing the interests of the Telugu people through principled political leadership and community service. Working tirelessly for the development, prosperity, and cultural preservation of Telangana and Andhra Pradesh.',

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
 * TODO(office): these are placeholders. The source document lists them as
 * "[to be provided]". `verified: false` keeps them out of the rendered UI and
 * out of the structured data — flip to true once real values are supplied.
 */
export const contact = {
  email: { value: 'contact@harikrishnatalikota.com', verified: false },
  press: { value: 'press@harikrishnatalikota.com', verified: false },
  phone: { value: '', display: '', verified: false },
  office: { value: 'Hyderabad, Telangana, India', verified: true },
  hours: { value: '', verified: false },
}

export const social = [
  {
    name: 'Instagram',
    handle: '@hari_krishna_talikota',
    url: 'https://www.instagram.com/hari_krishna_talikota/',
  },
  {
    name: 'Facebook',
    handle: 'Talikota Harikrishna',
    url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/',
  },
  {
    name: 'X',
    handle: '@THK_iTDP',
    url: 'https://x.com/THK_iTDP',
  },
]

export const party = {
  name: 'Telugu Desam Party',
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
    'The Telugu Desam Party was founded in 1982 by legendary actor and statesman N.T. Rama Rao (NTR) with the vision of promoting Telugu self-respect and regional development. Under the current leadership of N. Chandrababu Naidu, the party continues to champion development-oriented governance and technological innovation.',
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
    'Hari Krishna Talikota is a dedicated political leader and community servant who has committed his life to advancing the interests of the Telugu people. As the iTDP Telangana State President, he leads the Telugu Desam Party’s efforts in Telangana, working to promote development, good governance, and Telugu cultural pride.',
  journey:
    'As the iTDP Telangana State President, Hari Krishna represents the Telugu Desam Party’s vision in Telangana. He is committed to the party’s founding principles established by the legendary N.T. Rama Rao — Telugu pride, regional development, and good governance. His political work focuses on creating economic opportunities, improving infrastructure, and ensuring that the voices of Telangana’s citizens are heard at all levels of government.',
  community:
    'Serving as a Board Member of the prestigious Sri Kanaka Durga Devasthanam in Vijayawada, Hari Krishna contributes to the administration and development of one of South India’s most revered temples. This role reflects his deep commitment to preserving cultural and religious traditions while ensuring excellent service to millions of devotees.',
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
      'Putting the needs of constituents first and working tirelessly for their welfare.',
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
    'Located on the Indrakeeladri Hill on the banks of the Krishna River in Vijayawada, Andhra Pradesh, the Kanaka Durga Temple is dedicated to Goddess Kanaka Durga. The temple attracts millions of devotees annually and is particularly renowned for its Navaratri celebrations.',
  history:
    'The temple has a rich history spanning centuries and is considered one of the most powerful Shakti Peethas in India. It plays a central role in the spiritual and cultural life of the Telugu people.',
  intro:
    'Hari Krishna Talikota serves as a Board Member of the Sri Kanaka Durga Devasthanam in Vijayawada, one of the most revered Hindu temples in South India. This role reflects his commitment to preserving religious and cultural traditions while ensuring excellent service to devotees.',
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
    { name: 'Vasantha Navaratri', note: 'Spring festival celebrating the goddess' },
    { name: 'Sharad Navaratri', note: 'Autumn festival with grand celebrations' },
    { name: 'Ugadi', note: 'Telugu New Year celebrations' },
    { name: 'Special Poojas', note: 'Religious ceremonies throughout the year' },
  ],
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
    q: 'Who is Hari Krishna Talikota?',
    a: 'Hari Krishna Talikota is an Indian politician who serves as the iTDP Telangana State President of the Telugu Desam Party (TDP). He is also a Board Member of the Sri Kanaka Durga Devasthanam at Indrakeeladri, Vijayawada. He is based in Hyderabad, Telangana, and is also known as Talikota Harikrishna.',
  },
  {
    q: 'Which political party does Hari Krishna Talikota belong to?',
    a: 'He belongs to the Telugu Desam Party (TDP), founded in 1982 by N.T. Rama Rao and led nationally by N. Chandrababu Naidu, with Nara Lokesh as National Working President. Hari Krishna Talikota serves as the party’s iTDP Telangana State President.',
  },
  {
    q: 'What is his role at the Sri Kanaka Durga temple?',
    a: 'He serves as a Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam — popularly the Sri Kanaka Durga Temple — on Indrakeeladri Hill in Vijayawada, Andhra Pradesh. The role covers temple administration, financial stewardship, devotee services and the preservation of temple tradition.',
  },
  {
    q: 'What are Hari Krishna Talikota’s political focus areas?',
    a: 'His stated focus areas are economic development and employment for youth, infrastructure development, social welfare including education and healthcare, good governance and transparency, Telugu cultural preservation, and direct community engagement across Telangana.',
  },
  {
    q: 'Where is Hari Krishna Talikota based?',
    a: 'His base of operations is Hyderabad, Telangana, India. His political work covers Telangana state, and his temple board service is in Vijayawada, Andhra Pradesh.',
  },
  {
    q: 'How can I contact Hari Krishna Talikota?',
    a: 'You can reach the office through the contact page on this website, or follow the official social media channels — Instagram (@hari_krishna_talikota), Facebook (Talikota Harikrishna) and X (@THK_iTDP).',
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
