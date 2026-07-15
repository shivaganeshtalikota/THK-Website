import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import { site, temple } from '../data/site'
import { photos } from '../data/images'

const Community = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Community Service',
    url: `${site.url}/community`,
    about: {
      '@type': 'PlaceOfWorship',
      name: temple.officialName,
      alternateName: temple.popularName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Vijayawada',
        addressRegion: 'Andhra Pradesh',
        addressCountry: 'IN',
      },
    },
  }

  return (
    <>
      <Seo
        title="Community Service"
        description="Hari Krishna Talikota serves on the board of Sri Kanaka Durga Devasthanam, contributing to temple administration, devotee services and cultural preservation."
        schema={schema}
      />

      <PageHero
        eyebrow="Community Service"
        title="Board Member, Sri Kanaka Durga Devasthanam"
        lead={temple.intro}
      />

      {/* ---- The temple --------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">About the Temple</p>
            <h2 className="mt-3 text-title">{temple.popularName}</h2>
            <div className="rule mt-6" />
            <div className="mt-6 space-y-5 text-ink-600">
              <p className="text-lead">{temple.significance}</p>
              <p>{temple.history}</p>
            </div>

            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-ink-100 sm:grid-cols-2">
              {[
                ['Official name', temple.officialName],
                ['Deity', temple.deity],
                ['Location', temple.location],
                ['River', temple.river],
              ].map(([term, desc]) => (
                <div key={term} className="bg-white p-4">
                  <dt className="font-heading text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-500">
                    {term}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink-800">{desc}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            <Photo photo={photos.community} className="shadow-card ring-1 ring-ink-900/5" />
          </Reveal>
        </div>
      </section>

      {/* ---- Board responsibilities --------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Board Responsibilities</p>
            <h2 className="mt-3 text-title">Stewardship of a living tradition</h2>
            <div className="rule mt-6" />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {temple.duties.map((duty, i) => (
              <Reveal key={duty.title} delay={i * 0.06} className="card h-full">
                <h3 className="font-heading text-lg font-bold text-ink-900">{duty.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {duty.points.map((point) => (
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

      {/* ---- Festivals ----------------------------------------------------- */}
      <section className="on-brand section bg-brand-texture">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-ink-900/70">
              Major Festivals
            </p>
            <h2 className="mt-3 text-title text-ink-900">The temple calendar</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {temple.festivals.map((festival, i) => (
              <Reveal
                key={festival.name}
                delay={i * 0.06}
                className="rounded-2xl bg-white p-6 shadow-card"
              >
                <h3 className="font-heading text-base font-bold text-ink-900">
                  {festival.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{festival.note}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Community
