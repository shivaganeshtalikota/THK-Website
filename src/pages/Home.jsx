import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { FaArrowRight, FaLandmark, FaOm } from 'react-icons/fa'
import Seo from '../components/Seo'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import Icon from '../components/Icon'
import { site, party, focusAreas, temple } from '../data/site'
import { photos } from '../data/photos'

/**
 * Verifiable credentials — the replacement for the old stats bar, which
 * claimed "10+ Years of Service / 1000+ Community Events / 50K+ Lives
 * Impacted". Those numbers appear in no source and were invented. Everything
 * below is stated in website-content-master.md and is checkable.
 */
const credentials = [
  { label: 'iTDP Telangana', value: 'State President' },
  { label: 'Sri Kanaka Durga Devasthanam', value: 'Board Member' },
  { label: 'Telugu Desam Party', value: 'Founded 1982' },
  { label: 'Base of operations', value: 'Hyderabad' },
]

const Home = () => {
  const reduce = useReducedMotion()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      '@id': `${site.url}/#person`,
      name: site.name,
      alternateName: site.alternateNames,
      jobTitle: site.role,
      description: site.description,
      url: site.url,
      image: `${site.url}/og-image.png`,
      nationality: { '@type': 'Country', name: 'India' },
      memberOf: {
        '@type': 'PoliticalParty',
        name: party.name,
        alternateName: party.abbr,
        url: party.url,
        foundingDate: party.foundedISO,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.location.locality,
        addressRegion: site.location.region,
        addressCountry: site.location.countryCode,
      },
      sameAs: [
        'https://www.instagram.com/hari_krishna_talikota/',
        'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/',
        'https://x.com/THK_iTDP',
      ],
    },
  }

  return (
    <>
      <Seo
        title="Home"
        description={site.description}
        schema={schema}
      />

      {/* ---- Hero -------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-grid opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-custom relative py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Copy */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
                <span className="font-heading text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-800">
                  {site.role}
                </span>
              </span>

              {/* No marker-pen highlight under the surname here: the header
                  wordmark now uses exactly that device, and repeating it a
                  second time on the same screen reads as clutter rather than
                  emphasis. The display type carries the hero on its own. */}
              <h1 className="mt-6 text-display text-ink-900">
                Hari Krishna
                <span className="block">Talikota</span>
              </h1>

              <p className="mt-7 max-w-xl text-lead text-ink-600">
                {site.tagline}. Committed to Telugu pride, regional development, and good
                governance — carrying forward the founding principles of{' '}
                <span className="font-semibold text-ink-800">N.T. Rama Rao</span>.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/political" className="btn-brand">
                  Political Vision <FaArrowRight aria-hidden="true" />
                </Link>
                <Link to="/contact" className="btn-outline">
                  Get Involved
                </Link>
              </div>

              {/* Dual-role summary */}
              <dl className="mt-12 grid max-w-lg gap-4 sm:grid-cols-2">
                {[
                  { icon: FaLandmark, term: 'Political', desc: `${site.role}` },
                  { icon: FaOm, term: 'Community', desc: 'Board Member, Sri Kanaka Durga Devasthanam' },
                ].map(({ icon: Glyph, term, desc }) => (
                  <div key={term} className="flex gap-3 border-l-2 border-brand-500 pl-4">
                    <div>
                      <dt className="flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-brand-800">
                        <Glyph aria-hidden="true" /> {term}
                      </dt>
                      <dd className="mt-1 text-sm leading-snug text-ink-600">{desc}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </motion.div>

            {/* Portrait */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={reduce ? {} : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div
                  className="absolute -inset-3 rounded-[2rem] bg-brand-500/25 blur-2xl"
                  aria-hidden="true"
                />
                <Picture
                  photo={photos.hero}
                  priority
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="shadow-lift ring-1 ring-ink-900/5"
                />
                <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-ink-900 px-5 py-4 shadow-lift sm:block">
                  <p className="font-heading text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-400">
                    {party.abbr} · Telangana
                  </p>
                  <p className="mt-0.5 font-heading text-sm font-bold text-white">
                    State President
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---- Credentials strip ------------------------------------------- */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="container-custom">
          <dl className="grid grid-cols-2 divide-ink-200 lg:grid-cols-4 lg:divide-x">
            {credentials.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.07} className="px-2 py-7 text-center lg:px-6">
                <dt className="font-heading text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-500">
                  {c.label}
                </dt>
                <dd className="mt-1.5 font-heading text-base font-bold text-ink-900 sm:text-lg">
                  {c.value}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- Mission ----------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Our Mission</p>
            <blockquote className="mt-5">
              <p className="text-title text-ink-900">
                “{site.mission}”
              </p>
            </blockquote>
            <div className="rule mx-auto mt-8" />
          </Reveal>
        </div>
      </section>

      {/* ---- Focus areas ------------------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Political Focus Areas</p>
            <h2 className="mt-3 text-title">
              Working towards development and prosperity for all of Telangana
            </h2>
            <div className="rule mt-6" />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {focusAreas.map((area, i) => (
              <Reveal key={area.slug} delay={i * 0.06}>
                <Link
                  to="/political"
                  className="card-interactive group flex h-full flex-col"
                  aria-label={`${area.title} — read more on the Political Leadership page`}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-lg text-ink-900 transition-transform duration-300 group-hover:scale-105">
                    <Icon name={area.icon} />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-ink-900">
                    {area.title}
                  </h3>
                  <p className="mt-2 flex-grow text-sm leading-relaxed text-ink-600">
                    {area.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-brand-800">
                    Learn more
                    <FaArrowRight
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Two roles --------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom grid gap-6 lg:grid-cols-2">
          <Reveal className="group relative overflow-hidden rounded-3xl bg-ink-900 p-9 lg:p-12">
            <div
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/15 blur-2xl transition-transform duration-500 group-hover:scale-125"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-ink-900">
                <FaLandmark aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-headline text-white">Political Leadership</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
                Leading the Telugu Desam Party’s efforts across Telangana — building the
                organisation, representing citizens’ interests, and advancing
                development-oriented governance.
              </p>
              <Link
                to="/political"
                className="mt-7 inline-flex items-center gap-2 py-1 font-heading text-sm font-bold text-brand-400 transition-colors hover:text-brand-300"
              >
                Explore the vision
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="group relative overflow-hidden rounded-3xl bg-brand-texture p-9 lg:p-12">
            <div className="on-brand relative">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-brand-400">
                <FaOm aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-headline text-ink-900">Community Service</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-800">
                Serving on the board of {temple.popularName} at {temple.location} — supporting
                temple administration, devotee services, and the preservation of Telugu
                cultural and religious tradition.
              </p>
              <Link
                to="/community"
                className="mt-7 inline-flex items-center gap-2 py-1 font-heading text-sm font-bold text-ink-900 transition-colors hover:text-ink-700"
              >
                Explore the service
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- CTA --------------------------------------------------------- */}
      <section className="section bg-ink-950">
        <div className="container-custom">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-400">
              Get Involved
            </p>
            <h2 className="mt-4 text-title text-white">Join our movement</h2>
            <p className="mt-5 text-lead text-ink-300">
              Be part of the change. Together, we can build a prosperous and inclusive
              Telangana that honours our heritage while embracing progress.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="btn-brand">
                Contact the office <FaArrowRight aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="btn border-2 border-white/25 text-white hover:border-white hover:bg-white hover:text-ink-900"
              >
                Learn more
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Home
