import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import Icon from '../components/Icon'
import { site, party, focusAreas } from '../data/site'
import { photos } from '../data/images'

const Political = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Political Leadership',
    url: `${site.url}/political`,
    about: {
      '@type': 'PoliticalParty',
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

  return (
    <>
      <Seo
        title="Political Leadership"
        description="Hari Krishna Talikota serves as iTDP Telangana State President, leading Telugu Desam Party's efforts for development and good governance in Telangana."
        schema={schema}
      />

      <PageHero
        eyebrow="Political Leadership"
        title="Leading Telangana’s development"
        lead={`As ${site.role}, Hari Krishna Talikota leads the Telugu Desam Party's efforts in Telangana — advancing development, good governance, and Telugu pride.`}
      />

      {/* ---- Intro + image ----------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">The Mandate</p>
            <h2 className="mt-3 text-title">Representing the citizens of Telangana</h2>
            <div className="rule mt-6" />
            <p className="mt-6 text-lead text-ink-600">
              His political work focuses on representing the interests of Telangana’s
              citizens and building a stronger, more prosperous state — creating economic
              opportunity, improving infrastructure, and ensuring that people’s voices are
              heard at every level of government.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Photo photo={photos.political} className="shadow-card ring-1 ring-ink-900/5" />
          </Reveal>
        </div>
      </section>

      {/* ---- TDP heritage ------------------------------------------------- */}
      <section className="section bg-ink-950">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-400">
                About Telugu Desam Party
              </p>
              <h2 className="mt-3 text-title text-white">A legacy of Telugu self-respect</h2>
              <div className="rule mt-6" />
              <p className="mt-6 text-ink-300">{party.heritage}</p>
              <a
                href={party.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 py-1 font-heading text-sm font-bold text-brand-400 transition-colors hover:text-brand-300"
              >
                Visit the official TDP site
                <span className="sr-only"> (opens in a new tab)</span>
                <FaArrowRight aria-hidden="true" />
              </a>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-6">
              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
                {facts.map(([term, desc]) => (
                  <div key={term} className="bg-ink-950 p-5">
                    <dt className="font-heading text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-400">
                      {term}
                    </dt>
                    <dd className="mt-1.5 font-heading text-sm font-bold text-white">{desc}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Focus areas -------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Focus Areas</p>
            <h2 className="mt-3 text-title">
              Comprehensive initiatives for a prosperous Telangana
            </h2>
            <div className="rule mt-6" />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {focusAreas.map((area, i) => (
              <Reveal key={area.slug} delay={i * 0.06} className="card h-full">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-lg text-ink-900">
                  <Icon name={area.icon} />
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold text-ink-900">
                  {area.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {area.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand-600"
                        aria-hidden="true"
                      />
                      <span className="text-sm leading-relaxed text-ink-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Get involved -------------------------------------------------- */}
      <section className="on-brand section bg-brand-texture">
        <div className="container-custom">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-title text-ink-900">Get involved</h2>
            <p className="mt-5 text-lead text-ink-800">
              Join the Telugu Desam Party and contribute to building a better Telangana.
              Be part of a movement dedicated to Telugu pride and regional development.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
            {[
              {
                title: 'Party Membership',
                body: 'Join TDP and be part of the change you want to see in Telangana.',
                cta: 'Join now',
              },
              {
                title: 'Volunteer',
                body: 'Support party activities and make a difference in your community.',
                cta: 'Volunteer',
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08} className="rounded-2xl bg-white p-7 shadow-card">
                <h3 className="font-heading text-lg font-bold text-ink-900">{card.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{card.body}</p>
                <Link to="/contact" className="btn-primary mt-6 !px-6 !py-3">
                  {card.cta} <FaArrowRight aria-hidden="true" />
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
