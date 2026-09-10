import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaCommentDots, FaXmark, FaChevronLeft, FaArrowRight } from 'react-icons/fa6'
import { site, contact, social, party, temple } from '../data/site'

/**
 * A small "ask about him" panel, bottom right.
 *
 * NOT a chatbot. Every answer here is written, fixed text drawn from the same
 * data that renders the pages, so it cannot invent a claim about a real
 * politician — which is the entire risk with a generative widget on a site like
 * this. The visitor picks a question, reads a short answer, and follows a link
 * to the page that covers it properly.
 *
 * The answers are deliberately short. This is a signpost, not a substitute for
 * the pages.
 */
const xAccount = social.find((s) => s.name === 'X')
const instagram = social.find((s) => s.name === 'Instagram')
const youtube = social.find((s) => s.name === 'YouTube')

const QUESTIONS = [
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

const AskPanel = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  // Introduces itself, then gets out of the way. The label is shown for three
  // seconds so a first-time visitor knows what the button is, then it collapses
  // to the icon; hover or keyboard focus brings the label back.
  const [introducing, setIntroducing] = useState(true)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    setPicked(null)
    buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setIntroducing(false), 3000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    // Move focus into the panel so a keyboard user is not left behind the
    // trigger, and so Escape is meaningful.
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const answer = picked === null ? null : QUESTIONS[picked]

  // Not on the publishing panel — that page is for the office, not visitors.
  // Checked after the hooks so the hook order stays identical on every render.
  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIntroducing(false)
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-controls="ask-panel"
        aria-label={open ? 'Close the questions panel' : 'Ask about him'}
        className="group fixed bottom-5 right-5 z-50 inline-flex h-14 items-center rounded-full bg-ink-900 pl-[1.15rem] pr-[1.15rem] font-sans text-sm font-semibold text-white shadow-lift transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:right-6"
      >
        {open ? (
          <FaXmark size={19} className="shrink-0" aria-hidden="true" />
        ) : (
          <FaCommentDots size={22} className="shrink-0 text-brand-400" aria-hidden="true" />
        )}
        {/*
          Collapsing on max-width rather than unmounting, so the label slides
          away instead of disappearing. aria-hidden because the button already
          carries the same text as its accessible name — without it a screen
          reader announces "Ask about him" twice.
        */}
        <span
          aria-hidden="true"
          className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out ${
            open || introducing
              ? 'ml-2.5 max-w-[9rem] opacity-100'
              : 'ml-0 max-w-0 opacity-0 group-hover:ml-2.5 group-hover:max-w-[9rem] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100'
          }`}
        >
          {open ? 'Close' : 'Ask about him'}
        </span>
      </button>

      <div
        id="ask-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label="Questions about Talikota Hari Krishna"
        /*
         * `hidden` cannot be used here. The element also carries Tailwind's
         * `flex`, and a class selector beats the user-agent's [hidden]
         * { display: none } on specificity — so the panel stayed laid out at
         * opacity 0, 361x216, fixed over the bottom right of every page, with
         * pointer-events: auto. It silently swallowed taps, swipes and text
         * selection in that whole area on every route.
         *
         * The open state is a class instead, and the closed state sets
         * visibility: hidden and pointer-events: none in CSS, which is both
         * genuinely inert and still animatable.
         */
        aria-hidden={!open}
        className={`ask-panel fixed bottom-24 right-5 z-50 flex max-h-[min(34rem,calc(100vh-9rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden border border-ink-200 bg-white shadow-frame ${
          open ? 'is-open' : ''
        }`}
      >
        <div className="flex items-center gap-3 border-b hairline bg-brand-500 px-5 py-4">
          {answer !== null && (
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-ink-900 transition-colors hover:bg-ink-900/10"
              aria-label="Back to the questions"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
          )}
          <p className="font-display text-base font-bold leading-tight text-ink-900">
            {answer ? 'Answer' : 'What would you like to know?'}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {answer === null ? (
            <ul className="divide-y hairline">
              {QUESTIONS.map((item, i) => (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setPicked(i)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm text-ink-800 transition-colors hover:bg-ink-50"
                  >
                    <span className="flex-1">{item.q}</span>
                    <FaArrowRight className="shrink-0 text-xs text-ink-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-5">
              <p className="font-display text-sm font-semibold text-ink-900">{answer.q}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{answer.a}</p>
              {answer.links?.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {answer.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link
                          to={l.to}
                          onClick={close}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline underline-offset-4 hover:text-ink-900"
                        >
                          {l.label}
                          <FaArrowRight className="text-xs" aria-hidden="true" />
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline underline-offset-4 hover:text-ink-900"
                        >
                          {l.label}
                          <FaArrowRight className="text-xs" aria-hidden="true" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="border-t hairline px-5 py-3.5">
          <Link
            to="/contact"
            onClick={close}
            className="text-xs font-semibold text-ink-600 underline underline-offset-4 hover:text-ink-900"
          >
            Not answered here? Write to the office →
          </Link>
        </div>
      </div>
    </>
  )
}

export default AskPanel
