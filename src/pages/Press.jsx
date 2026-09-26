import { FaArrowRight, FaNewspaper, FaUpRightFromSquare } from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site } from '../data/site'
import { press, pressIssues, pressImage, pressThumb } from '../data/press'
import { useT, useLang } from '../i18n/useT'

const formatDate = (iso, lang = 'en') =>
  new Date(`${iso}T12:00:00+05:30`).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

/**
 * /press — what the newspapers have reported.
 *
 * The cuttings themselves, not a retelling: each one is shown as printed, with
 * the paper, the date and a plain English summary beside the Telugu headline,
 * and opens full size so it can be read. The issues he has taken up come
 * first, because that is what the coverage is about.
 */
const Press = () => {
  const t = useT()
  const lang = useLang()
  const byTopic = (topic) => press.filter((p) => p.topic === topic)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${site.name} — in the news`,
    about: { '@id': `${site.url}/#person` },
    hasPart: press.map((p) => ({
      '@type': 'NewsArticle',
      headline: p.headline,
      inLanguage: 'te',
      datePublished: p.date,
      publisher: { '@type': 'Organization', name: p.paper },
      image: `${site.url}${pressImage(p.slug)}`,
      about: { '@id': `${site.url}/#person` },
    })),
  }

  const meta = (p) =>
    [t(p.paper), p.page ? `${t('Page')} ${p.page}` : null, `${formatDate(p.date, lang)}${p.dateline ? ` (${t('dateline')})` : ''}`]
      .filter(Boolean)
      .join(' · ')

  return (
    <>
      <Seo
        title="In the news"
        description={`Newspaper coverage of ${site.name}: the Jawahar Nagar dumping yard, two divisions for Nagaram, party and temple work — the cuttings as printed.`}
        schema={schema}
      />
      <PageHero
        eyebrow="Press"
        title="In the news"
        lead="What the newspapers have reported — the cuttings as printed, with the paper and the date."
      />

      {/* ---- Issues -------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t('On the ground')}</p>
            <h2 className="mt-5 font-display text-display">{t('Issues he has taken up')}</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {Object.entries(pressIssues).map(([key, issue], i) => {
              const reports = byTopic(key)
              const lead = reports.find((r) => r.featured) || reports[0]
              return (
                <Reveal key={key} delay={i * 0.08} as="article" className="flex flex-col overflow-hidden rounded-sm border hairline bg-ink-50">
                  <a
                    href={pressImage(lead.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block aspect-[16/10] overflow-hidden bg-ink-100"
                    aria-label={`${t(issue.title)} — ${t('open the cutting')}`}
                  >
                    <img
                      src={pressThumb(lead.slug)}
                      alt={`${t(lead.paper)}: ${lead.headline}`}
                      width={lead.w}
                      height={lead.h}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </a>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <h3 className="font-display text-title text-ink-900">{t(issue.title)}</h3>
                    <p className="mt-4 leading-relaxed text-ink-600">{t(issue.summary)}</p>
                    <ul className="mt-6 space-y-1.5 border-t hairline pt-5 text-sm">
                      {reports.map((r) => (
                        <li key={r.slug}>
                          <a href={`#${r.slug}`} className="inline-flex items-center gap-2 font-medium text-ink-800 underline-offset-4 hover:underline">
                            <FaNewspaper className="shrink-0 text-brand-700" aria-hidden="true" />
                            {meta(r)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---- Every cutting ------------------------------------------------ */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t('Coverage')}</p>
            <h2 className="mt-5 font-display text-display">{t('Newspaper cuttings')}</h2>
            <p className="mt-6 text-lead text-ink-600">{t('Newest first. Tap a cutting to read it full size.')}</p>
          </Reveal>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {press.map((p, i) => (
              <Reveal key={p.slug} as="li" delay={Math.min(i, 5) * 0.05} className="scroll-mt-[calc(var(--nav-h)+1rem)]" id={p.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-sm border hairline bg-white">
                  <a href={pressImage(p.slug)} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[4/5] overflow-hidden border-b hairline bg-white p-3">
                    <img
                      src={pressThumb(p.slug)}
                      alt={`${t(p.paper)}, ${formatDate(p.date, lang)}: ${p.headline}`}
                      width={p.w}
                      height={p.h}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain object-top transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-sm bg-ink-950/80 px-2.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                      <FaUpRightFromSquare aria-hidden="true" /> {t('Full size')}
                    </span>
                  </a>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-sans text-micro uppercase text-brand-800">{meta(p)}</p>
                    <h3 lang="te" className="mt-3 font-sans text-lg font-semibold leading-snug text-ink-900">
                      {p.headline}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-600">{t(p.summary)}</p>
                    {p.also && (
                      <a href={pressImage(p.also)} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-semibold text-ink-800 underline underline-offset-4">
                        {t('Continued on the inside page')}
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-12">
            <Link to="/media" className="group inline-flex items-center gap-3 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900">
              {t('Photos and video')}
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Press
