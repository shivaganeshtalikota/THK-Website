import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import { site, party, biography, values, responsibilities, roles, faqs } from '../data/site'
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
        title="Biography & Public Service"
        description="Hari Krishna Talikota — Board Member of the Sri Kanaka Durga Devasthanam at Indrakeeladri and iTDP Telangana State President. His public service, core values and vision for Telangana."
        schema={schema}
      />

      <PageHero
        eyebrow="About"
        title="A life in public service"
        lead="Two offices, one commitment — to the traditions that shape Telugu life, and to the development that will carry it forward."
        photo={photos.about}
      />

      {/* ---- Biography ------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow">Biography</p>
              <div className="mt-8 space-y-6 text-lead text-ink-600">
                <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:font-display first-letter:text-[4.2rem] first-letter:font-bold first-letter:leading-[0.75] first-letter:text-brand-700">
                  {biography.intro}
                </p>
                <p>{biography.community}</p>
                <p>{biography.journey}</p>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <Picture
                  photo={photos.about}
                  rounded=""
                  sizes="(max-width: 1024px) 90vw, 400px"
                  className="shadow-frame"
                />
                <dl className="mt-8 divide-y hairline border-y hairline">
                  {[
                    ...roles.map((r) => [r.title, r.org]),
                    ['Party', `${party.name} (${party.abbr})`],
                    ['Based in', `${site.location.locality}, ${site.location.region}`],
                  ].map(([term, desc]) => (
                    <div key={term} className="py-4">
                      <dt className="font-sans text-micro uppercase text-ink-500">{term}</dt>
                      <dd className="mt-1.5 text-sm font-medium text-ink-900">{desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Vision --------------------------------------------------------- */}
      <section className="bg-ink-950 py-24 lg:py-32">
        <div className="on-dark container-text text-center">
          <Reveal>
            <p className="eyebrow">Vision for Telangana</p>
            <p className="mt-8 font-display text-[clamp(1.35rem,1.05rem+1.5vw,2.3rem)] font-semibold leading-[1.35] tracking-[-0.015em] text-white">
              {biography.vision}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---- Values --------------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Core Values</p>
            <h2 className="mt-5 font-display text-display">The principles behind the work</h2>
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal
                key={value.title}
                delay={Math.min(i, 5) * 0.05}
                className="border-t hairline pt-6"
              >
                <h3 className="font-display text-headline text-ink-900">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-600">{value.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Responsibilities ----------------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">The Party Office</p>
              <h2 className="mt-5 font-display text-title">What the State President does</h2>
              <p className="mt-6 text-ink-600">
                As {site.secondaryRole}, the work spans organisation-building, representation,
                and keeping the party answerable to the citizens it serves.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <ul className="divide-y hairline border-y hairline">
                {responsibilities.map((item, i) => (
                  <li key={item} className="flex items-baseline gap-6 py-4">
                    {/* brand-800, not brand-700: at 14px this is small text and
                        brand-700 measures 3.99:1 against the ink-50 ground. */}
                    <span
                      className="font-display text-sm font-bold tabular-nums text-brand-800"
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

      {/* ---- FAQ ------------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow">Frequently Asked</p>
              <h2 className="mt-5 font-display text-title">Common questions</h2>
              <p className="mt-6 text-ink-600">
                Straight answers about his roles, party and public service.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-8">
              <dl className="divide-y hairline border-y hairline">
                {faqs.map((f) => (
                  <div key={f.q} className="py-7">
                    <dt className="font-display text-headline text-ink-900">{f.q}</dt>
                    <dd className="mt-3 leading-relaxed text-ink-600">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- NTR legacy ------------------------------------------------------ */}
      <section className="bg-brand-500 py-24 lg:py-32">
        <div className="on-brand container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="label-rule !text-ink-800 before:!bg-ink-900/40">Party Heritage</p>
              <h2 className="mt-7 font-display text-title text-ink-900">
                Carrying forward NTR’s legacy
              </h2>
              <p className="mt-6 text-ink-800">{party.heritage}</p>
              <Link to="/political" className="btn-outline mt-9">
                Political leadership <FaArrowRight aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {party.principles.map((principle, i) => (
                  <li key={principle} className="border-t border-ink-900/20 pt-4">
                    {/* /70, not /60: composited over the party yellow, 60%
                        black lands at 4.36:1 — just under the 4.5 small-text
                        minimum. 70% clears it at 5.9:1. */}
                    <span
                      className="font-display text-sm font-bold tabular-nums text-ink-900/70"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="mt-1.5 font-medium leading-snug text-ink-900">{principle}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
