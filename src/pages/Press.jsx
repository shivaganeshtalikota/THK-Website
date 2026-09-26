import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaNewspaper, FaPlay, FaUpRightFromSquare, FaXmark, FaLandmark } from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site } from '../data/site'
import { cuttings, pressIssues, onlineReports, officialRecord, interviews } from '../data/press'
import { useT, useLang } from '../i18n/useT'

const formatDate = (iso, lang = 'en') =>
  new Date(`${iso}T12:00:00+05:30`).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const TOPICS = [
  { id: 'all', label: 'All' },
  { id: 'dumping-yard', label: 'Dumping yard' },
  { id: 'nagaram-divisions', label: 'Nagaram divisions' },
  { id: 'party', label: 'Party work' },
  { id: 'temple', label: 'Temple' },
  { id: 'community', label: 'Community' },
]

/**
 * The cutting, full size, in the page — with the paper, the date, what it
 * says, and the link to the original where it is online. Arrow keys step
 * through; Escape closes. Opening a new tab for every cutting (the first
 * version) took people away from the page; this keeps them on it.
 */
const Viewer = ({ items, index, onClose, onStep, meta }) => {
  const t = useT()
  const item = items[index]
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onStep])
  if (!item) return null
  return (
    <div data-overlay="viewer" className="fixed inset-0 z-[70] flex flex-col bg-ink-950 lg:flex-row" role="dialog" aria-modal="true" aria-label={item.headline}>
      <div className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto p-3 sm:p-6 lg:items-center">
        {item.image ? (
          <img src={item.image} alt={`${t(item.paper)}: ${item.headline}`} className="h-auto max-w-full bg-white shadow-2xl lg:max-h-full lg:w-auto lg:object-contain" />
        ) : (
          <div className="grid h-full place-items-center text-white/60">
            <FaNewspaper className="text-5xl" aria-hidden="true" />
          </div>
        )}
      </div>
      <aside className="max-h-[45vh] shrink-0 overflow-auto border-t border-white/10 bg-ink-900 p-5 text-white sm:p-7 lg:max-h-none lg:w-[26rem] lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-micro uppercase text-brand-400">{meta(item)}</p>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={t('Close')}>
            <FaXmark aria-hidden="true" />
          </button>
        </div>
        <h2 lang="te" className="mt-4 font-sans text-xl font-semibold leading-snug">
          {item.headline}
        </h2>
        {item.summary && <p className="mt-4 text-sm leading-relaxed text-white/75">{t(item.summary)}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-brand !px-4 !py-2.5">
              {t('Read the original')} <FaUpRightFromSquare aria-hidden="true" />
            </a>
          )}
          {item.also && (
            <a href={item.also} target="_blank" rel="noopener noreferrer" className="btn-ghost-light !px-4 !py-2.5">
              {t('Continued on the inside page')}
            </a>
          )}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
          <button type="button" onClick={() => onStep(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <FaChevronLeft aria-hidden="true" /> {t('Newer')}
          </button>
          <span className="text-xs text-white/50">
            {index + 1} / {items.length}
          </span>
          <button type="button" onClick={() => onStep(1)} className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            {t('Older')} <FaChevronRight aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
  )
}

/** A YouTube video, played in the page (youtube-nocookie.com: no tracking cookies until play). */
const Player = ({ video, onClose }) => {
  const t = useT()
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div data-overlay="player" className="fixed inset-0 z-[70] grid place-items-center bg-ink-950 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={video.title}>
      <div className="w-full max-w-5xl">
        <div className="mb-3 flex items-center justify-between gap-4 text-white">
          <p className="min-w-0 truncate text-sm font-semibold">
            {video.channel} · {video.title}
          </p>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={t('Close')}>
            <FaXmark aria-hidden="true" />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * /press — what the newspapers, television and the web have reported.
 */
const Press = () => {
  const t = useT()
  const lang = useLang()
  const [topic, setTopic] = useState('all')
  const [open, setOpen] = useState(null) // index into `shown`
  const [video, setVideo] = useState(null)

  const shown = useMemo(() => (topic === 'all' ? cuttings : cuttings.filter((c) => c.topic === topic)), [topic])
  const papers = useMemo(() => new Set([...cuttings.map((c) => c.paper), ...onlineReports.map((o) => o.outlet)]).size, [])

  // A link to /press#<slug> opens that cutting.
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1))
    const i = cuttings.findIndex((c) => c.slug === slug)
    if (i >= 0) setOpen(i)
  }, [])

  const openSlug = (slug, list) => {
    setOpen(list.findIndex((c) => c.slug === slug))
    window.history.replaceState(null, '', `#${slug}`)
  }
  const openFromIssue = (slug) => {
    setTopic('all')
    openSlug(slug, cuttings)
  }
  const close = useCallback(() => {
    setOpen(null)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])
  const step = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length])

  const meta = (p) =>
    [t(p.paper), p.page ? `${t('Page')} ${p.page}` : null, `${formatDate(p.date, lang)}${p.dateline ? ` (${t('dateline')})` : ''}`]
      .filter(Boolean)
      .join(' · ')

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${site.name} — in the news`,
    about: { '@id': `${site.url}/#person` },
    hasPart: [
      ...cuttings.map((p) => ({
        '@type': 'NewsArticle',
        headline: p.headline,
        inLanguage: 'te',
        datePublished: p.date,
        publisher: { '@type': 'Organization', name: p.paper },
        ...(p.image ? { image: `${site.url}${p.image}` } : {}),
        ...(p.url ? { url: p.url } : {}),
        about: { '@id': `${site.url}/#person` },
      })),
      ...onlineReports.map((o) => ({
        '@type': 'NewsArticle',
        headline: o.headline,
        inLanguage: 'te',
        datePublished: o.date,
        author: { '@type': 'Person', name: o.byline },
        publisher: { '@type': 'Organization', name: o.outlet },
        url: o.url,
        mentions: { '@id': `${site.url}/#person` },
      })),
      ...interviews.map((v) => ({
        '@type': 'VideoObject',
        name: v.title,
        description: v.summary,
        uploadDate: v.date,
        thumbnailUrl: `${site.url}/photos/video/${v.id}.webp`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
        contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
        about: { '@id': `${site.url}/#person` },
      })),
    ],
  }

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
        aside={
          <dl className="grid grid-cols-3 gap-3 text-white">
            {[
              [cuttings.length + onlineReports.length, 'Reports'],
              [papers, 'Newspapers & sites'],
              [interviews.length, 'Interviews & TV'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs text-white/60">{t(l)}</dt>
                <dd className="mt-1 font-display text-3xl font-bold tabular-nums lining-nums text-brand-400">{n}</dd>
              </div>
            ))}
          </dl>
        }
      />

      {/* ---- Issues -------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('On the ground')}</p>
              <h2 className="mt-5 font-display text-display">{t('Issues he has taken up')}</h2>
            </div>
            <p className="text-lead text-ink-600 lg:col-span-7">
              {t('Local causes he has pressed on behalf of Nagaram and the villages around it — each with the newspapers that reported it.')}
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {Object.entries(pressIssues).map(([key, issue], i) => {
              const reports = cuttings.filter((c) => c.topic === key)
              const lead = reports.find((r) => r.featured) || reports[0]
              if (!lead) return null
              return (
                <Reveal key={key} delay={i * 0.08} as="article" className="grid overflow-hidden rounded-sm border hairline bg-ink-50 sm:grid-cols-[13rem_1fr]">
                  <button
                    type="button"
                    onClick={() => openFromIssue(lead.slug)}
                    className="group block aspect-[16/10] overflow-hidden bg-white sm:aspect-auto"
                    aria-label={`${t(issue.title)} — ${t('open the cutting')}`}
                  >
                    <img src={lead.thumb} alt={`${t(lead.paper)}: ${lead.headline}`} loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
                  </button>
                  <div className="p-6">
                    <h3 className="font-display text-headline text-ink-900">{t(issue.title)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-600">{t(issue.summary)}</p>
                    <ul className="mt-4 space-y-1.5 border-t hairline pt-4 text-sm">
                      {reports.map((r) => (
                        <li key={r.slug}>
                          <button type="button" onClick={() => openFromIssue(r.slug)} className="inline-flex items-center gap-2 text-left font-medium text-ink-800 underline-offset-4 hover:underline">
                            <FaNewspaper className="shrink-0 text-brand-700" aria-hidden="true" />
                            {meta(r)}
                          </button>
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
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('Coverage')}</p>
              <h2 className="mt-5 font-display text-display">{t('Newspaper cuttings')}</h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-ink-600">{t('Newest first. Tap a cutting to read it full size.')}</p>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('Filter by topic')}>
                {TOPICS.map((tp) => {
                  const n = tp.id === 'all' ? cuttings.length : cuttings.filter((c) => c.topic === tp.id).length
                  if (!n) return null
                  const active = topic === tp.id
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTopic(tp.id)}
                      className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-500'
                      }`}
                    >
                      {t(tp.label)} <span className={active ? 'text-brand-400' : 'text-ink-400'}>{n}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((p, i) => (
              <li key={p.slug} id={p.slug} className="scroll-mt-[calc(var(--nav-h)+1rem)]">
                <article className="flex h-full flex-col overflow-hidden rounded-sm border hairline bg-white">
                  <button
                    type="button"
                    onClick={() => openSlug(p.slug, shown)}
                    className="group relative block aspect-[4/5] overflow-hidden border-b hairline bg-white p-3"
                    aria-label={`${t('Read')}: ${p.headline}`}
                  >
                    {p.thumb ? (
                      <img
                        src={p.thumb}
                        alt={`${t(p.paper)}, ${formatDate(p.date, lang)}: ${p.headline}`}
                        width={p.w}
                        height={p.h}
                        loading={i < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="h-full w-full object-contain object-top transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <FaNewspaper className="mx-auto h-full text-5xl text-ink-300" aria-hidden="true" />
                    )}
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-sm bg-ink-950/80 px-2.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                      {t('Read')}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-sans text-micro uppercase text-brand-800">{meta(p)}</p>
                    <h3 lang="te" className="mt-3 font-sans text-base font-semibold leading-snug text-ink-900">
                      {p.headline}
                    </h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-ink-600">{t(p.summary)}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Interviews ---------------------------------------------------- */}
      <section className="section bg-ink-950">
        <div className="on-dark container-custom">
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('On camera')}</p>
              <h2 className="mt-5 font-display text-display text-white">{t('Interviews & TV')}</h2>
            </div>
            <p className="text-white/70 lg:col-span-7">{t('Interviews and television coverage on Telugu news channels. They play here, on this page.')}</p>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {interviews.map((v) => (
              <li key={v.id}>
                <button type="button" onClick={() => setVideo(v)} className="group block w-full text-left">
                  <span className="relative block overflow-hidden bg-ink-800">
                    <img
                      src={`/photos/video/${v.id}.webp`}
                      alt={`${v.channel}: ${v.title} — Talikota Hari Krishna`}
                      width="640"
                      height="360"
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-ink-950/20" aria-hidden="true">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-ink-900 transition-transform group-hover:scale-110">
                        <FaPlay className="ml-0.5" />
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 block font-sans text-micro uppercase text-brand-400">
                    {t(v.kind)} · {v.channel} · {formatDate(v.date, lang)}
                  </span>
                  <span lang={/[ఀ-౿]/.test(v.title) ? 'te' : undefined} className="mt-2 block text-sm font-semibold leading-snug text-white">
                    {v.title}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-white/60">{t(v.summary)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Online reports + the official record ------------------------- */}
      <section className="section bg-white">
        <div className="container-custom grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow">{t('Online')}</p>
            <h2 className="mt-5 font-display text-title">{t('Reported online')}</h2>
            <ul className="mt-6 divide-y divide-ink-100 border-y hairline">
              {onlineReports.map((o) => (
                <li key={o.id} className="py-5">
                  <p className="font-sans text-micro uppercase text-brand-800">
                    {o.outlet} · {formatDate(o.date, lang)} · {o.byline}
                  </p>
                  <p lang="te" className="mt-2 font-semibold leading-snug text-ink-900">
                    {o.headline}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{t(o.summary)}</p>
                  <a href={o.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 underline underline-offset-4">
                    {t('Read on')} {o.outlet} <FaUpRightFromSquare className="text-xs" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="h-full rounded-sm border hairline bg-ink-50 p-6 sm:p-8">
              <FaLandmark className="text-2xl text-brand-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-headline text-ink-900">{t('The official record')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{t(officialRecord.summary)}</p>
              <a href={officialRecord.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 underline underline-offset-4">
                {t('Temple website — Trust Board')} <FaUpRightFromSquare className="text-xs" aria-hidden="true" />
              </a>
              <Link to="/community" className="group mt-6 flex items-center gap-3 border-t hairline pt-5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900">
                {t('The board’s work')}
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {open !== null && <Viewer items={shown} index={open} onClose={close} onStep={step} meta={meta} />}
      {video && <Player video={video} onClose={() => setVideo(null)} />}
    </>
  )
}

export default Press
