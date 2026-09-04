import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa6'
import Seo from '../components/Seo'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import { site, party, focusAreas, temple, roles } from '../data/site'
import { photos, gallery } from '../data/photos'

const Home = () => {

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${site.url}/#person` },
  }


  const featured = gallery.filter((g) => ['party', 'temple'].includes(g.group)).slice(0, 4)

  return (
    <>
      {/* No title prop: the homepage takes the full descriptive title. */}
      <Seo description={site.description} schema={schema} />

      {/* ================= HERO =================
          Split: type on the left, a 4:3 photograph on the right. The previous
          full-bleed treatment cropped him to a zoomed face and forced the
          header to float over the image; this keeps the whole podium frame
          visible and lets the header stay a solid yellow bar. */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="container-custom relative py-14 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="on-dark lg:col-span-6 xl:col-span-5">
              <Reveal as="p" delay={0.05} className="label-rule !text-brand-400 before:!bg-brand-500">
                {site.location.region} · {party.name}
              </Reveal>

              {/* Both names at the same size and weight — the surname is not a
                  lesser line. The gold rule sits under the pair. */}
              <Reveal as="h1" delay={0.14} className="relative mt-7 inline-block">
                <span className="block font-display text-hero text-white">Hari Krishna</span>
                <span className="block font-display text-hero text-white">Talikota</span>
                <span
                  className="mt-4 block h-[5px] w-28 bg-brand-500 sm:w-36"
                  aria-hidden="true"
                />
              </Reveal>

              {/* Both offices, temple seat first. */}
              <Reveal delay={0.23} className="mt-8 space-y-4">
                {roles.map((r) => (
                  <div key={r.title} className="border-l-2 border-brand-500 pl-5">
                    <p className="font-sans text-base font-semibold text-white sm:text-lg">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-sm text-white/70">{r.org}</p>
                  </div>
                ))}
              </Reveal>

              <Reveal delay={0.32} className="mt-10 flex flex-wrap gap-3">
                <Link to="/community" className="btn-brand">
                  Temple Service <FaArrowRight aria-hidden="true" />
                </Link>
                <Link to="/political" className="btn-ghost-light">
                  Political Leadership
                </Link>
              </Reveal>
            </div>

            <Reveal
              variant="fade"
              delay={0.2}
              className="lg:col-span-6 lg:col-start-7 xl:col-span-7"
            >
              <div className="relative">
                <Picture
                  photo={photos.hero}
                  priority
                  rounded=""
                  aspect="4 / 3"
                  sizes="(max-width: 1024px) 92vw, 55vw"
                  className="shadow-frame"
                />
                {/* Offset yellow rule — a small piece of structure so the photo
                    reads as placed rather than dropped in. */}
                <span
                  className="absolute -bottom-3 -right-3 hidden h-24 w-24 border-b-4 border-r-4 border-brand-500 lg:block"
                  aria-hidden="true"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= MISSION PULL-QUOTE =================
          Set as an actual quotation at display size, not another centred card. */}
      <section className="section bg-white">
        <div className="container-text">
          <Reveal>
            <p className="eyebrow">Mission</p>
            {/* Sized as a quotation, not a headline. `text-display` is tuned
                for three or four words; a sixty-word mission statement at that
                size fills an entire screen and stops being readable. */}
            <blockquote className="relative mt-8">
              <span
                className="absolute -left-1 -top-8 font-display text-[5rem] leading-none text-brand-700 sm:-left-8 sm:-top-6 sm:text-[7rem]"
                aria-hidden="true"
              >
                “
              </span>
              <p className="relative font-display text-[clamp(1.35rem,1.05rem+1.5vw,2.3rem)] font-semibold leading-[1.35] tracking-[-0.015em] text-ink-900">
                {site.mission}
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ================= TEMPLE — LEAD ROLE =================
          Full-bleed split. The temple seat gets the first and largest block. */}
      <section className="relative bg-ink-950">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[22rem] lg:min-h-[42rem]">
            <Picture
              photo={photos.community}
              rounded=""
              aspect="auto"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="!absolute inset-0 h-full w-full"
              imgClassName="object-[center_28%]"
            />
          </div>

          <div className="on-dark flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            <Reveal className="max-w-xl">
              <p className="label-rule !text-brand-400 before:!bg-brand-500">
                Devasthanam Board
              </p>
              <h2 className="mt-7 font-display text-title text-white">
                Board Member, Sri Kanaka Durga Devasthanam
              </h2>
              <p className="mt-6 text-lead text-white/70">{temple.intro}</p>
              <p className="mt-5 text-white/60">
                The Devasthanam at Indrakeeladri in Vijayawada is one of South India’s most
                visited Shakti Peethas, drawing millions of devotees each year. Board service
                covers temple administration, financial stewardship, devotee facilities and the
                continuity of tradition.
              </p>
              <Link
                to="/community"
                className="group mt-9 inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:text-brand-300"
              >
                The board’s work
                <FaArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= POLITICAL ROLE ================= */}
      <section className="relative bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="on-brand order-2 flex items-center bg-brand-500 px-6 py-16 sm:px-10 lg:order-1 lg:px-16 lg:py-24">
            <Reveal className="max-w-xl">
              <p className="label-rule !text-ink-800 before:!bg-ink-900/40">Party Office</p>
              <h2 className="mt-7 font-display text-title text-ink-900">
                iTDP Telangana State President
              </h2>
              <p className="mt-6 text-lead text-ink-800">
                Leading the Telugu Desam Party’s organisation across Telangana — building
                membership, representing citizens’ interests, and carrying forward the founding
                principles set by N.T. Rama Rao.
              </p>
              <Link
                to="/political"
                className="group mt-9 inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900 transition-opacity hover:opacity-70"
              >
                Political vision
                <FaArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          </div>

          <div className="relative order-1 min-h-[22rem] lg:order-2 lg:min-h-[42rem]">
            <Picture
              photo={photos.political}
              rounded=""
              aspect="auto"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="!absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* ================= FOCUS AREAS =================
          A numbered editorial list. The icon-in-a-rounded-tile grid this
          replaces is the single most template-looking pattern on the web. */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Focus Areas</p>
            <h2 className="mt-5 font-display text-display">
              Where the work is directed
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
                <Link
                  to="/political"
                  className="group grid items-baseline gap-x-8 gap-y-2 py-8 sm:grid-cols-[4rem_1fr] lg:grid-cols-[5rem_20rem_1fr] lg:py-10"
                >
                  <span className="index-num transition-colors duration-300 group-hover:text-brand-700" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-headline text-ink-900 transition-transform duration-500 ease-out group-hover:translate-x-1">
                    {area.title}
                  </h3>
                  <p className="text-ink-600 sm:col-span-2 lg:col-span-1 lg:pt-1">
                    {area.summary}
                  </p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= PHOTO STRIP ================= */}
      <section className="bg-ink-950 py-20 lg:py-28">
        <div className="on-dark container-custom">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">In Pictures</p>
              <h2 className="mt-5 font-display text-display text-white">Recent activity</h2>
            </div>
            <Link
              to="/media"
              className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:text-brand-300"
            >
              Full gallery
              <FaArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                aria-hidden="true"
              />
            </Link>
          </Reveal>

          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item, i) => (
              <Reveal as="li" key={item.slug} delay={i * 0.07}>
                <Link to="/media" className="group block">
                  <div className="overflow-hidden">
                    <Picture
                      photo={item}
                      aspect="3 / 4"
                      rounded=""
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22vw"
                      imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-4 text-sm leading-snug text-white/65 transition-colors group-hover:text-white">
                    {item.caption}
                  </p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section bg-white">
        <div className="container-text text-center">
          <Reveal>
            <h2 className="font-display text-display">Join the movement</h2>
            <p className="mx-auto mt-6 max-w-xl text-lead text-ink-600">
              Be part of the change. Together we can build a prosperous, inclusive Telangana
              that honours its heritage while embracing progress.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="btn-primary">
                Contact the office <FaArrowRight aria-hidden="true" />
              </Link>
              <Link to="/about" className="btn-outline">
                About Hari Krishna
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Home
