import { useEffect, useState } from 'react'
import { FaLocationDot, FaClock, FaArrowUpRightFromSquare } from 'react-icons/fa6'
import siteContent from '../data/site-content.js'
import { useLang, useT } from '../i18n/useT'
import Reveal from './Reveal'

/**
 * Upcoming programmes, as entered by the office in the admin panel (Events &
 * programmes).
 *
 * Past events drop off on their own: the prerendered HTML lists what was
 * upcoming on the day the site was built, and the browser removes anything
 * whose date has since passed — so a programme never lingers on the homepage
 * after it has happened just because nothing else was published that week.
 * With nothing upcoming the section is not rendered at all, rather than
 * showing an empty heading.
 */

const today = () => new Date().toISOString().slice(0, 10)

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  te: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జూలై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
}

function upcoming(from) {
  return (siteContent?.events || [])
    .filter((e) => e.date && e.date >= from)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
    .slice(0, 6)
}

/** 18:30 -> 6:30 PM; the office types 24-hour times, people read 12-hour. */
function clock(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const UpcomingEvents = () => {
  const t = useT()
  const lang = useLang()
  const [events, setEvents] = useState(() => upcoming(today()))

  useEffect(() => {
    setEvents(upcoming(today()))
  }, [])

  if (!events.length) return null

  return (
    <section className="section bg-ink-50" aria-labelledby="events-heading">
      <div className="container-custom">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t('Programmes')}</p>
          <h2 id="events-heading" className="mt-4 font-display text-title">
            {t('Upcoming programmes')}
          </h2>
        </Reveal>

        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => {
            const [, mm, dd] = e.date.split('-')
            const title = lang === 'te' ? e.titleTe || e.titleEn : e.titleEn || e.titleTe
            const venue = lang === 'te' ? e.venueTe || e.venueEn : e.venueEn || e.venueTe
            const desc = lang === 'te' ? e.descriptionTe || e.descriptionEn : e.descriptionEn || e.descriptionTe
            return (
              <Reveal as="li" key={e.id} delay={i * 0.06} className="flex gap-5 border hairline bg-white p-6">
                <div className="grid h-16 w-16 shrink-0 place-items-center bg-ink-900 text-center leading-none text-white">
                  <span>
                    <span className="block font-display text-2xl font-bold">{Number(dd)}</span>
                    <span className="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brand-400">
                      {MONTHS[lang === 'te' ? 'te' : 'en'][Number(mm) - 1]}
                    </span>
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-semibold leading-snug text-ink-900" {...(lang === 'te' ? { lang: 'te' } : {})}>
                    {title}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-ink-600">
                    {e.time && (
                      <p className="flex items-center gap-2">
                        <FaClock className="shrink-0 text-brand-700" aria-hidden="true" />
                        {clock(e.time)}
                      </p>
                    )}
                    {venue && (
                      <p className="flex items-start gap-2">
                        <FaLocationDot className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
                        <span>{venue}</span>
                      </p>
                    )}
                  </div>
                  {desc && <p className="mt-3 text-sm leading-relaxed text-ink-600">{desc}</p>}
                  {e.link && (
                    <a
                      href={e.link}
                      target={e.link.startsWith('/') ? undefined : '_blank'}
                      rel={e.link.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 underline-offset-2 hover:underline"
                    >
                      {t('Details')}
                      <FaArrowUpRightFromSquare className="text-[0.7em]" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default UpcomingEvents
