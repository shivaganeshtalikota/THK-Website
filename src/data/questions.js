/**
 * The questions the ask panel offers, and their answers.
 *
 * Lifted out of the component so the strings can be imported by tooling as
 * well as rendered — the translation workflow needs the exact answer text, and
 * these are built with template literals from site data rather than written
 * out, so there was no way to read them without evaluating the module.
 *
 * NOT A CHATBOT. Every answer here is fixed text drawn from the same data that
 * renders the pages, so it cannot invent a claim about a real politician —
 * which is the entire risk with a generative widget on a site like this. The
 * visitor picks a question, reads a short answer, and follows a link to the
 * page that covers it properly. The answers are deliberately short: this is a
 * signpost, not a substitute for the pages.
 */
import { site, contact, social, party, temple } from './site'

const xAccount = social.find((s) => s.name === 'X')
const instagram = social.find((s) => s.name === 'Instagram')
const youtube = social.find((s) => s.name === 'YouTube')

export const QUESTIONS = [
  {
    q: 'Who is Talikota Hari Krishna?',
    a: `${site.name} is an Indian politician from Telangana. He serves as a Board Member of the ${temple.officialName} at Indrakeeladri, Vijayawada — the temple widely known as ${temple.popularName} — and as ${site.secondaryRole} of the ${party.name}.`,
    links: [{ to: '/about', label: 'Read his biography' }],
  },
  {
    q: 'Is he the same person as Nandamuri Harikrishna?',
    a: `No. Nandamuri Harikrishna (1956–2018) was a different TDP politician and actor, the son of party founder N. T. Rama Rao. ${site.name} is a serving Devasthanam Board Member and ${site.secondaryRole}, based in Hyderabad. The names are similar and search engines often confuse the two.`,
    links: [{ to: '/about', label: 'About Talikota Hari Krishna' }],
  },
  {
    q: 'What does he do at the temple?',
    a: `He is one of the Board Members of the ${temple.officialName} at ${temple.location}. The role covers temple administration, financial stewardship, devotee services and the upkeep of tradition. He is a board member, not the chairman.`,
    links: [{ to: '/community', label: 'Temple service in detail' }],
  },
  {
    q: 'What is the iTDP, and what is his role in it?',
    a: `The iTDP is the Telugu Desam Party's IT wing. As its ${site.secondaryRole}, he leads the party's organisation among IT professionals in Telangana — membership, representation and mobilisation.`,
    links: [{ to: '/political', label: 'His political work' }],
  },
  {
    q: 'Which party does he belong to?',
    a: `The ${party.name} (${party.abbr}), founded in ${party.founded} by ${party.founder}. Its national president is ${party.nationalPresident} and its symbol is the ${party.symbol.toLowerCase()}.`,
    links: [
      { to: '/political', label: 'Party and leadership' },
      { href: party.url, label: 'Official TDP website' },
    ],
  },
  {
    q: 'What has he campaigned on recently?',
    a: 'In September 2023 he led the iTDP Telangana mobilisation for the IT professionals’ demonstration at Wipro Circle in Gachibowli, Hyderabad, following the arrest of N. Chandrababu Naidu. The protest was covered by V6 News, Deccan Chronicle, The News Minute, The Hans India and Eenadu.',
    links: [{ to: '/political', label: 'See the coverage' }],
  },
  {
    q: 'How do I contact the office?',
    a: contact.email.verified
      ? `Write to ${contact.email.value}, or use the contact form. The office is based in ${contact.office.value}.`
      : `Use the contact form — it goes straight to the office. He is based in ${contact.office.value}. A published email address and phone number will be added once confirmed.`,
    links: [{ to: '/contact', label: 'Open the contact form' }],
  },
  {
    q: 'What are his social media accounts?',
    a: `The official accounts are ${social
      .filter((s) => s.official)
      .map((s) => `${s.name} (${s.handle})`)
      .join(', ')}. Video coverage also appears on ${social.find((s) => !s.official)?.handle ?? 'YouTube'}, a supporter-run channel that is not operated by the office. Anything else is not his.`,
    links: [
      ...(xAccount ? [{ href: xAccount.url, label: `X — ${xAccount.handle}` }] : []),
      ...(instagram ? [{ href: instagram.url, label: `Instagram — ${instagram.handle}` }] : []),
      ...(youtube ? [{ href: youtube.url, label: `YouTube — ${youtube.handle}` }] : []),
    ],
  },
  {
    q: 'Where can I see photographs and videos?',
    a: 'The media page carries the photo gallery — party events, constituency programmes, temple service and cultural celebrations — alongside video coverage from Team Haranna, a supporter-run YouTube channel that is not operated by the office.',
    links: [{ to: '/media', label: 'Photographs and video' }],
  },
  {
    q: 'Where is he based?',
    a: `${contact.office.value}. His temple board role is at Indrakeeladri in Vijayawada, Andhra Pradesh, and his party work is across Telangana.`,
    links: [{ to: '/about', label: 'More about his work' }],
  },
  {
    q: 'How can I get involved or volunteer?',
    a: 'The contact form has a subject for volunteering and for joining the party. Send a note with your district and the office will follow up.',
    links: [{ to: '/contact', label: 'Get in touch' }],
  },
]
