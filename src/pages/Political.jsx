import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa6'
import PartyMark from '../components/PartyMark'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import { site, party, focusAreas, campaigns } from '../data/site'
import { photos, gallery } from '../data/photos'

const Political = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Political Leadership',
    url: `${site.url}/political`,
    about: {
      '@type': 'PoliticalParty',
      '@id': `${site.url}/#party`,
      name: party.name,
      alternateName: party.abbr,
      url: party.url,
      foundingDate: party.foundedISO,
      founder: { '@type': 'Person', name: 'N.T. Rama Rao' },
      member: { '@type': 'Person', '@id': `${site.url}/#person`, name: site.name },
    },
  }

  const facts = [
    ['Founded', party.founded],
    ['Founder', party.founder],
    ['National President', party.nationalPresident],
    ['Working President', party.workingPresident],
    ['Party symbol', party.symbol],
    ['Party colours', party.colors],
  ]

  const partyPhotos = gallery.filter((g) => g.group === 'party').slice(0, 4)

  return (
    <>
      <Seo
        title="iTDP Telangana State President"
        description="Hari Krishna Talikota, iTDP Telangana State President — leading the Telugu Desam Party’s organisation in Telangana, and the Wipro Circle mobilisation."
        schema={schema}
      />

      <PageHero
        eyebrow="Party Office"
        title="iTDP Telangana State President"
        lead="Leading the Telugu Desam Party’s efforts across Telangana — advancing development, good governance, and Telugu pride."
        photo={photos.bannerPolitical}
      />

      {/* ---- Mandate --------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">The Mandate</p>
              <h2 className="mt-5 font-display text-display">
                Representing the citizens of Telangana
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <p className="text-lead text-ink-600">
                His political work focuses on representing the interests of Telangana’s
                citizens and building a stronger, more prosperous state — creating economic
                opportunity, improving infrastructure, and ensuring that people’s voices are
                heard at every level of government.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- TDP heritage ----------------------------------------------------- */}
      <section className="bg-ink-950 py-24 lg:py-32">
        <div className="on-dark container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-6">
              {/* Standalone here, so the emblem carries the alt text itself. */}
              <PartyMark size={72} showName={false} className="mb-7" />
              <p className="eyebrow">Telugu Desam Party</p>
              <h2 className="mt-5 font-display text-display text-white">
                A legacy of Telugu self-respect
              </h2>
              <p className="mt-8 text-lead text-white/70">{party.heritage}</p>
              <a
                href={party.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-9 inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:text-brand-300"
              >
                Official TDP site
                <span className="sr-only"> (opens in a new tab)</span>
                <FaArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </a>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-6">
              <dl className="divide-y hairline-dark border-y hairline-dark">
                {facts.map(([term, desc]) => (
                  <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 py-4">
                    <dt className="font-sans text-micro uppercase text-white/55">{term}</dt>
                    <dd className="text-sm font-medium text-white">{desc}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Focus areas ------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Focus Areas</p>
            <h2 className="mt-5 font-display text-display">
              Initiatives for a prosperous Telangana
            </h2>
          </Reveal>

          <ul className="mt-14 border-t hairline">
            {focusAreas.map((area, i) => (
              <Reveal
                as="li"
                key={area.slug}
                delay={Math.min(i, 5) * 0.05}
                className="border-b hairline"
              >
                <div className="grid gap-x-10 gap-y-4 py-9 lg:grid-cols-[4rem_18rem_1fr] lg:py-11">
                  <span className="index-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-headline text-ink-900">{area.title}</h3>
                  <ul className="space-y-2.5 lg:pt-1">
                    {area.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-ink-600">
                        <span
                          className="mt-[0.6rem] h-px w-3 shrink-0 bg-brand-600"
                          aria-hidden="true"
                        />
                        <span className="text-[0.95rem] leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Campaigns & mobilisations ---------------------------------------- */}
      {campaigns.length > 0 && (
        <section className="section bg-ink-950">
          <div className="on-dark container-custom">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Leadership in Action</p>
              <h2 className="mt-5 font-display text-display text-white">
                Campaigns &amp; mobilisations
              </h2>
            </Reveal>

            <div className="mt-14 space-y-14">
              {campaigns.map((c, i) => (
                <Reveal
                  as="article"
                  key={c.slug}
                  delay={i * 0.06}
                  className="grid gap-8 border-t hairline-dark pt-9 lg:grid-cols-12 lg:gap-14"
                >
                  <div className="lg:col-span-4">
                    <p className="font-sans text-micro uppercase text-brand-400">
                      {c.dateLabel}
                    </p>
                    <h3 className="mt-3 font-display text-headline text-white">{c.title}</h3>
                    <p className="mt-2 text-sm text-white/55">{c.place}</p>
                  </div>

                  <div className="lg:col-span-8">
                    <p className="text-lead text-white/75">{c.summary}</p>
                    <p className="mt-5 border-l-2 border-brand-500 pl-5 text-white/70">
                      {c.role}
                    </p>

                    {c.coverage?.length > 0 && (
                      <div className="mt-7">
                        <p className="font-sans text-micro uppercase text-white/45">
                          Press coverage
                        </p>
                        <ul className="mt-3 space-y-2">
                          {c.coverage.map((m) => (
                            <li key={m.url}>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-baseline gap-2.5 py-1 text-sm text-white/70 transition-colors hover:text-brand-300"
                              >
                                <span className="font-semibold text-brand-400">{m.outlet}</span>
                                <span className="underline-offset-4 group-hover:underline">
                                  {m.title}
                                </span>
                                <span className="sr-only"> (opens in a new tab)</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Party photographs ------------------------------------------------ */}
      {partyPhotos.length > 0 && (
        <section className="bg-ink-50 py-20 lg:py-28">
          <div className="container-custom">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">In Pictures</p>
                <h2 className="mt-5 font-display text-display">Party &amp; leadership</h2>
              </div>
              <Link
                to="/media"
                className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-800 transition-opacity hover:opacity-70"
              >
                Full gallery
                <FaArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>

            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {partyPhotos.map((item, i) => (
                <Reveal as="li" key={item.slug} delay={i * 0.07}>
                  <Link to="/media" className="group block">
                    <div className="overflow-hidden">
                      <Picture
                        photo={item}
                        aspect="1 / 1"
                        rounded=""
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22vw"
                        imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-4 text-sm leading-snug text-ink-600 transition-colors group-hover:text-ink-900">
                      {item.caption}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---- Get involved ------------------------------------------------------ */}
      <section className="bg-brand-500 py-24 lg:py-32">
        <div className="on-brand container-custom">
          <Reveal className="max-w-2xl">
            <p className="label-rule !text-ink-800 before:!bg-ink-900/40">Get Involved</p>
            <h2 className="mt-7 font-display text-display text-ink-900">
              Be part of the movement
            </h2>
            <p className="mt-6 text-lead text-ink-800">
              Join the Telugu Desam Party and contribute to building a better Telangana.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:max-w-4xl">
            {[
              {
                title: 'Party membership',
                body: 'Join TDP and be part of the change you want to see in Telangana.',
                cta: 'Join now',
              },
              {
                title: 'Volunteer',
                body: 'Support party activities and make a difference in your community.',
                cta: 'Volunteer',
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08} className="border-t border-ink-900/25 pt-6">
                <h3 className="font-display text-headline text-ink-900">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-800">{card.body}</p>
                <Link
                  to="/contact"
                  className="group mt-6 inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900 transition-opacity hover:opacity-70"
                >
                  {card.cta}
                  <FaArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Political
