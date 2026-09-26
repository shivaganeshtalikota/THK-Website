import { FaArrowRight } from 'react-icons/fa6'
import Link from './LocaleLink'
import Reveal from './Reveal'
import { cuttings, pressIssues } from '../data/press'
import { useT } from '../i18n/useT'

/**
 * The local issues he has taken up — the Jawahar Nagar dumping yard first —
 * each with the newspaper that reported it. Shown on the home page; the full
 * coverage is on /press.
 */
const IssuesHighlight = () => {
  const t = useT()
  return (
    <section className="section bg-ink-50">
      <div className="container-custom">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('On the ground')}</p>
            <h2 className="mt-5 font-display text-display">{t('Issues he has taken up')}</h2>
          </div>
          <Link
            to="/press"
            className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900"
          >
            {t('In the news')}
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {Object.entries(pressIssues).map(([key, issue], i) => {
            const reports = cuttings.filter((p) => p.topic === key)
            const lead = reports.find((r) => r.featured) || reports[0]
            const papers = [...new Set(reports.map((r) => t(r.paper)))].join(', ')
            return (
              <Reveal key={key} delay={i * 0.08} as="article" className="grid overflow-hidden rounded-sm border hairline bg-white sm:grid-cols-[11rem_1fr]">
                <Link to={`/press#${lead.slug}`} className="block aspect-[16/10] overflow-hidden bg-ink-100 sm:aspect-auto">
                  <img
                    src={lead.thumb}
                    alt={`${t(lead.paper)}: ${lead.headline}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top"
                  />
                </Link>
                <div className="p-6">
                  <h3 className="font-display text-headline text-ink-900">{t(issue.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{t(issue.summary)}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-800">
                    {t('Reported in')} {papers}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default IssuesHighlight
