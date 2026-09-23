import { useEffect, useMemo, useState } from 'react'
import { FaXmark, FaArrowRight } from 'react-icons/fa6'
import siteContent from '../data/site-content.js'
import { useLang } from '../i18n/useT'
import Link from './LocaleLink'

/**
 * A one-line notice across the top of every page, set from the admin panel
 * (Announcement bar): a programme this Sunday, a helpline number, a change of
 * venue.
 *
 * It is part of the prerendered page — visible before any JavaScript runs —
 * and a visitor can dismiss it. Dismissal is remembered per announcement, so a
 * new message shows again even to somebody who closed the last one.
 *
 * An end date hides it automatically: checked at build time for the HTML, and
 * again in the browser after load, so a bar left switched on past its date
 * disappears without anyone having to remember to turn it off.
 */

const TONES = {
  brand: 'bg-brand-500 text-ink-900',
  dark: 'bg-ink-900 text-white',
  alert: 'bg-red-700 text-white',
}

const today = () => new Date().toISOString().slice(0, 10)

const AnnouncementBar = () => {
  const lang = useLang()
  const a = siteContent?.announcement
  const text = a ? (lang === 'te' ? a.te || a.en : a.en || a.te) : ''
  const key = useMemo(() => `thk-ann:${text.length}:${[...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)}`, [text])
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(key) === '1') setHidden(true)
    } catch {
      // private mode and the like: the bar simply stays
    }
    if (a?.until && today() > a.until) setHidden(true)
  }, [key, a?.until])

  if (!a?.enabled || !text || hidden) return null
  if (a.until && today() > a.until && typeof window === 'undefined') return null

  const label = lang === 'te' ? a.linkTe || a.linkEn : a.linkEn || a.linkTe
  const external = a.link && /^https:\/\//.test(a.link)

  const dismiss = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // nothing to remember it in; it is still hidden for this page view
    }
  }

  return (
    <div className={`${TONES[a.tone] || TONES.brand} relative`} role="region" aria-label="Announcement">
      <div className="container-custom flex items-center gap-3 py-2.5 pr-12 text-sm font-medium leading-snug sm:justify-center">
        <p {...(lang === 'te' ? { lang: 'te' } : {})}>
          {text}
          {a.link && (
            <>
              {' '}
              {external ? (
                <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                  {label || 'Details'}
                  <FaArrowRight className="text-[0.7em]" aria-hidden="true" />
                </a>
              ) : (
                <Link to={a.link} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                  {label || 'Details'}
                  <FaArrowRight className="text-[0.7em]" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full opacity-70 hover:opacity-100"
          aria-label="Dismiss announcement"
        >
          <FaXmark aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default AnnouncementBar
