import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import Icon from '../components/Icon'
import { site, party, biography, values, responsibilities, faqs } from '../data/site'
import { photos } from '../data/photos'

const About = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: `About ${site.name}`,
        url: `${site.url}/about`,
        mainEntity: { '@id': `${site.url}/#person` },
      },
      // FAQPage: gives search and AI answer engines explicit question/answer
      // pairs about who he is, rather than leaving them to infer it from prose.
      {
        '@type': 'FAQPage',
        '@id': `${site.url}/about#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      <Seo
        title="About"
        description="Learn about Hari Krishna Talikota's political journey, core values, and commitment to serving the people of Telangana as iTDP State President."
        schema={schema}
      />

      <PageHero
        eyebrow="About"
        title="A leader committed to Telangana"
        lead="Serving the people of Telangana with integrity, passion, and a clear vision for the state's future."
      />

      {/* ---- Biography --------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow">Political Biography</p>
              <div className="rule mt-4" />
              <div className="mt-8 space-y-6 text-lead text-ink-600">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-heading first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.8] first-letter:text-brand-700">
                  {biography.intro}
                </p>
                <p>{biography.journey}</p>
                <p>{biography.community}</p>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <Picture photo={photos.about} sizes="(max-width: 1024px) 90vw, 400px" className="shadow-card ring-1 ring-ink-900/5" />
                <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50 p-6">
                  <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
                    At a glance
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      ['Role', site.role],
                      ['Also serves as', site.secondaryRole],
                      ['Party', `${party.name} (${party.abbr})`],
                      ['Based in', `${site.location.locality}, ${site.location.region}`],
                    ].map(([term, desc]) => (
                      <div key={term} className="flex flex-col gap-0.5">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {term}
                        </dt>
                        <dd className="font-medium text-ink-800">{desc}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Vision ------------------------------------------------------ */}
      <section className="section bg-ink-950">
        <div className="container-custom">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-400">
              Vision for Telangana
            </p>
            <p className="mt-6 text-title text-white">{biography.vision}</p>
          </Reveal>
        </div>
      </section>

      {/* ---- Values ------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Core Values</p>
            <h2 className="mt-3 text-title">
              The principles guiding every decision in public service
            </h2>
            <div className="rule mt-6" />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 0.06} className="card h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-200">
                  <Icon name={value.icon} />
                </span>
                <h3 className="mt-5 font-heading text-base font-bold text-ink-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {value.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Responsibilities -------------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">The Role</p>
              <h2 className="mt-3 text-title">What the State President does</h2>
              <div className="rule mt-6" />
              <p className="mt-6 text-ink-600">
                As {site.role}, the work spans organisation-building, representation, and
                keeping the party accountable to the citizens it serves.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <ul className="divide-y divide-ink-200 border-y border-ink-200">
                {responsibilities.map((item, i) => (
                  <li key={item} className="flex items-baseline gap-5 py-4">
                    <span
                      className="font-heading text-xs font-bold tabular-nums text-brand-800"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow">Frequently Asked</p>
              <h2 className="mt-3 text-title">Common questions</h2>
              <div className="rule mt-6" />
              <p className="mt-6 text-sm leading-relaxed text-ink-600">
                Straight answers about his roles, party and public service.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-8">
              <dl className="divide-y divide-ink-200 border-y border-ink-200">
                {faqs.map((f) => (
                  <div key={f.q} className="py-6">
                    <dt className="font-heading text-base font-bold text-ink-900">{f.q}</dt>
                    <dd className="mt-2.5 leading-relaxed text-ink-600">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- NTR legacy -------------------------------------------------- */}
      <section className="on-brand section bg-brand-texture">
        <div className="container-custom">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-ink-900/70">
                Party Heritage
              </p>
              <h2 className="mt-3 text-title text-ink-900">Carrying forward NTR’s legacy</h2>
              <p className="mt-6 text-ink-800">{party.heritage}</p>
              <Link to="/political" className="btn-outline mt-8">
                Political leadership <FaArrowRight aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="rounded-3xl bg-white p-8 shadow-card lg:p-10">
                <h3 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
                  Party principles
                </h3>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {party.principles.map((principle) => (
                    <li key={principle} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                        aria-hidden="true"
                      />
                      <span className="text-sm leading-relaxed text-ink-700">{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
