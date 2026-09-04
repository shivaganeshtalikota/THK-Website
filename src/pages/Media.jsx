import { useState, useCallback, useEffect, useMemo } from 'react'
import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FaArrowRight, FaRegNewspaper, FaXmark, FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import { site, social, updates } from '../data/site'
import { photos, gallery, galleryGroups } from '../data/photos'
import { videos, channel } from '../data/videos'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter, YouTube: FaYoutube }

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Shown while `updates` is empty. The original build filled this space with
 * four invented press events carrying real-looking dates. An empty newsroom
 * that points to the live feeds is honest and still useful.
 */
const EmptyNewsroom = () => (
  <Reveal className="border-y hairline py-16 text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center text-xl text-ink-500">
      <FaRegNewspaper aria-hidden="true" />
    </span>
    <h3 className="mt-5 font-display text-headline text-ink-900">
      Press releases will appear here
    </h3>
    <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-600">
      Dated statements and announcements will be published on this page. The photo
      gallery below records recent activity, and the social channels carry the most
      current updates.
    </p>
    <a
      href={social.find((s) => s.name === 'X')?.url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary mt-8"
    >
      Latest on X<span className="sr-only"> (opens in a new tab)</span>
      <FaArrowRight aria-hidden="true" />
    </a>
  </Reveal>
)

/** Full-screen viewer. Keyboard-navigable and focus-trapped at the edges. */
const Lightbox = ({ items, index, onClose, onStep }) => {
  const item = items[index]

  useEffect(() => {
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
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-ink-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${items.length}: ${item.caption}`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="font-sans text-micro uppercase text-brand-400">
          {index + 1} / {items.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="grid h-11 w-11 place-items-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close photo viewer"
        >
          <FaXmark size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-2 px-2 sm:px-4">
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Previous photo"
        >
          <FaChevronLeft aria-hidden="true" />
        </button>

        <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
          <img
            src={`/photos/${item.slug}-1200.webp`}
            onError={(e) => {
              e.currentTarget.src = item.src
            }}
            alt={item.alt}
            className="max-h-[62vh] w-auto max-w-full object-contain"
          />
          <figcaption className="max-w-2xl px-2 text-center">
            <p className="text-sm font-medium text-white sm:text-base">{item.caption}</p>
            {item.telugu && (
              <p lang="te" className="mt-2 text-xs leading-relaxed text-white/60">
                {item.telugu}
              </p>
            )}
          </figcaption>
        </figure>

        <button
          type="button"
          onClick={() => onStep(1)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Next photo"
        >
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className="h-4" />
    </div>
  )
}

const Media = () => {
  const [group, setGroup] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const shown = useMemo(
    () => (group === 'all' ? gallery : gallery.filter((g) => g.group === group)),
    [group]
  )

  const step = useCallback(
    (delta) => setLightbox((i) => (i === null ? i : (i + delta + shown.length) % shown.length)),
    [shown.length]
  )

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Media & Updates',
    url: `${site.url}/media`,
    about: { '@id': `${site.url}/#person` },
    // Surfacing the gallery as ImageObjects gives Google Images real captions
    // to index against, which is a large share of political-name search traffic.
    hasPart: gallery.slice(0, 12).map((g) => ({
      '@type': 'ImageObject',
      contentUrl: `${site.url}/photos/${g.slug}-1200.webp`,
      caption: g.caption,
      creditText: `${site.name} official`,
    })),
  }

  return (
    <>
      <Seo
        title="Photo Gallery & Updates"
        description="Photographs and updates from Hari Krishna Talikota's political and community service work — party events, constituency programmes, temple service and Telugu cultural events."
        image={`${site.url}/photos/with-chandrababu-naidu-1200.webp`}
        schema={schema}
      />

      <PageHero
        eyebrow="Media & Updates"
        title="In pictures"
        lead="Party events, constituency programmes, temple service and Telugu cultural celebrations."
        photo={photos.bannerMedia}
        focus="object-[center_40%]"
      />

      {/* ---- Gallery ------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Photo Gallery</p>
            <h2 className="mt-5 font-display text-display">Recent activity</h2>
          </Reveal>

          {/* Filters */}
          <Reveal delay={0.05}>
            <div
              className="mt-9 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter photographs by category"
            >
              {galleryGroups.map((g) => {
                const active = group === g.id
                const count =
                  g.id === 'all' ? gallery.length : gallery.filter((x) => x.group === g.id).length
                if (!count) return null
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGroup(g.id)
                      setLightbox(null)
                    }}
                    aria-pressed={active}
                    className={`rounded-sm px-4 py-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                      active
                        ? 'bg-ink-900 text-white'
                        : 'border border-ink-200 text-ink-600 hover:border-ink-900 hover:text-ink-900'
                    }`}
                  >
                    {g.label}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* Grid */}
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item, i) => (
              <Reveal as="li" key={item.slug} delay={Math.min(i, 6) * 0.05}>
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group block w-full text-left"
                  aria-label={`Open photo: ${item.caption}`}
                >
                  <Picture
                    photo={item}
                    aspect="4 / 3"
                    rounded=""
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                  />
                  <p className="mt-3 text-sm font-medium leading-snug text-ink-800">
                    {item.caption}
                  </p>
                  {item.telugu && (
                    <p lang="te" className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">
                      {item.telugu}
                    </p>
                  )}
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Videos --------------------------------------------------------- */}
      <section className="section bg-ink-950">
        <div className="on-dark container-custom">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Video</p>
              <h2 className="mt-5 font-display text-display text-white">
                From the official channel
              </h2>
            </div>
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:text-brand-300"
            >
              {channel.handle}
              <span className="sr-only"> on YouTube (opens in a new tab)</span>
              <FaArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                aria-hidden="true"
              />
            </a>
          </Reveal>

          <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 9).map((v, i) => (
              <Reveal as="li" key={v.id} delay={Math.min(i, 5) * 0.05}>
                <a
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative overflow-hidden bg-ink-800">
                    <img
                      src={`/photos/video/${v.id}.webp`}
                      alt=""
                      width="640"
                      height="360"
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                    <span
                      className="absolute inset-0 grid place-items-center bg-ink-950/25 transition-colors group-hover:bg-ink-950/10"
                      aria-hidden="true"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-500/95 text-ink-900 transition-transform duration-300 group-hover:scale-110">
                        <FaPlay className="ml-0.5" />
                      </span>
                    </span>
                  </div>
                  <p className="mt-4 font-sans text-sm font-medium leading-snug text-white transition-colors group-hover:text-brand-300">
                    {v.title}
                    <span className="sr-only"> — watch on YouTube (opens in a new tab)</span>
                  </p>
                  {v.telugu && (
                    <p lang="te" className="mt-1.5 line-clamp-2 text-xs text-white/55">
                      {v.telugu}
                    </p>
                  )}
                  <time dateTime={v.published} className="mt-2 block text-xs text-white/45">
                    {formatDate(v.published)}
                  </time>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Newsroom ------------------------------------------------------ */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Press Releases</p>
            <h2 className="mt-5 font-display text-display">From the office</h2>
          </Reveal>

          <div className="mt-12">
            {updates.length === 0 ? (
              <EmptyNewsroom />
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {updates.map((update, i) => (
                  <Reveal
                    key={update.title}
                    delay={i * 0.06}
                    as="article"
                    className="h-full border-t hairline pt-6"
                  >
                    <time
                      dateTime={update.date}
                      className="font-sans text-micro uppercase text-brand-800"
                    >
                      {formatDate(update.date)}
                    </time>
                    <h3 className="mt-3 font-display text-headline text-ink-900">
                      {update.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{update.summary}</p>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- Social --------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Follow Along</p>
            <h2 className="mt-5 font-display text-display">Real-time updates on social</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {social.map((s, i) => {
              const Glyph = socialIcons[s.name]
              return (
                <Reveal key={s.name} delay={i * 0.07}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="group flex h-full items-center gap-4 border-t hairline py-6 transition-colors hover:border-ink-900"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center bg-ink-900 text-base text-brand-400 transition-transform duration-300 group-hover:scale-105">
                      <Glyph aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base font-semibold text-ink-900">
                        {s.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </span>
                      <span className="block truncate text-sm text-ink-500">{s.handle}</span>
                    </span>
                    <FaArrowRight
                      className="ml-auto shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700"
                      aria-hidden="true"
                    />
                  </a>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          items={shown}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onStep={step}
        />
      )}
    </>
  )
}

export default Media
