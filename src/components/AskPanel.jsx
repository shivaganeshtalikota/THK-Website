import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Link from './LocaleLink'
import { FaCommentDots, FaXmark, FaChevronLeft, FaArrowRight } from 'react-icons/fa6'
import { site, contact, social, party, temple } from '../data/site'
import { useT } from '../i18n/useT'

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
import { QUESTIONS } from '../data/questions'

const AskPanel = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  // Introduces itself, then gets out of the way. The label is shown for three
  // seconds so a first-time visitor knows what the button is, then it collapses
  // to the icon; hover or keyboard focus brings the label back.
  const [introducing, setIntroducing] = useState(true)
  const t = useT()
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
        aria-label={open ? t('Close the questions panel') : t('Ask about him')}
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
          {open ? t('Close') : t('Ask about him')}
        </span>
      </button>

      <div
        id="ask-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={t("Questions about Talikota Hari Krishna")}
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
              aria-label={t("Back to the questions")}
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
          )}
          <p className="font-display text-base font-bold leading-tight text-ink-900">
            {answer ? t('Answer') : t('What would you like to know?')}
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
                    <span className="flex-1">{t(item.q)}</span>
                    <FaArrowRight className="shrink-0 text-xs text-ink-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-5">
              <p className="font-display text-sm font-semibold text-ink-900">{t(answer.q)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{t(answer.a)}</p>
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
                          {t(l.label)}
                          <FaArrowRight className="text-xs" aria-hidden="true" />
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline underline-offset-4 hover:text-ink-900"
                        >
                          {t(l.label)}
                          <FaArrowRight className="text-xs" aria-hidden="true" />
                          <span className="sr-only"> {t('(opens in a new tab)')}</span>
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
            {t('Not answered here? Write to the office →')}
          </Link>
        </div>
      </div>
    </>
  )
}

export default AskPanel
