import { FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6'
import { FaArrowRight, FaRegNewspaper } from 'react-icons/fa'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { site, social, updates } from '../data/site'
import { gallery } from '../data/images'

const socialIcons = { Instagram: FaInstagram, Facebook: FaFacebookF, X: FaXTwitter }

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Shown while `updates` is empty. The previous build filled this space with
 * four invented press events carrying real-looking dates. An empty newsroom
 * that points people to the live social feeds is honest and still useful.
 */
const EmptyNewsroom = () => (
  <Reveal className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 px-6 py-14 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl text-ink-400 shadow-card">
      <FaRegNewspaper aria-hidden="true" />
    </span>
    <h3 className="mt-5 font-heading text-lg font-bold text-ink-900">
      Announcements will appear here
    </h3>
    <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-600">
      Press releases, event announcements and policy statements will be published on this
      page. In the meantime, the social channels below carry the most current updates.
    </p>
    <a
      href={social.find((s) => s.name === 'X')?.url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary mt-7 !px-6 !py-3"
    >
      Latest on X <FaArrowRight aria-hidden="true" />
    </a>
  </Reveal>
)

const Media = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Media & Updates',
    url: `${site.url}/media`,
    about: { '@id': `${site.url}/#person` },
  }

  return (
    <>
      <Seo
        title="Media & Updates"
        description="Latest news, announcements and media coverage from Hari Krishna Talikota's political and community service work in Telangana."
        schema={schema}
      />

      <PageHero
        eyebrow="Media & Updates"
        title="News, announcements and coverage"
        lead="Press releases, public statements and event announcements from the office of the iTDP Telangana State President."
      />

      {/* ---- Newsroom ------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Latest Updates</p>
            <h2 className="mt-3 text-title">From the office</h2>
            <div className="rule mt-6" />
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
                    className="card-interactive h-full"
                  >
                    <time
                      dateTime={update.date}
                      className="inline-block rounded-full bg-brand-50 px-3.5 py-1.5 font-heading text-[0.65rem] font-bold uppercase tracking-wider text-brand-800 ring-1 ring-brand-200"
                    >
                      {formatDate(update.date)}
                    </time>
                    <h3 className="mt-4 font-heading text-lg font-bold text-ink-900">
                      {update.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {update.summary}
                    </p>
                    {update.href && (
                      <a
                        href={update.href}
                        className="mt-5 inline-flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-brand-800"
                      >
                        Read more <FaArrowRight aria-hidden="true" />
                      </a>
                    )}
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- Gallery -------------------------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Photo Gallery</p>
            <h2 className="mt-3 text-title">Events and public meetings</h2>
            <div className="rule mt-6" />
          </Reveal>

          {gallery.length === 0 ? (
            <Reveal className="mt-10 rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-ink-500">
                Event photography will be published here.
              </p>
            </Reveal>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, i) => (
                <Reveal key={item.src} delay={i * 0.05} as="figure" className="group">
                  <div className="overflow-hidden rounded-2xl bg-ink-100">
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {item.caption && (
                    <figcaption className="mt-2.5 text-xs text-ink-500">
                      {item.caption}
                    </figcaption>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Social --------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Follow Along</p>
            <h2 className="mt-3 text-title">Real-time updates on social</h2>
            <div className="rule mt-6" />
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
                    className="card-interactive group flex h-full items-center gap-4"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-lg text-brand-400 transition-transform duration-300 group-hover:scale-105">
                      <Glyph aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-heading text-base font-bold text-ink-900">
                        {s.name}
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
    </>
  )
}

export default Media
