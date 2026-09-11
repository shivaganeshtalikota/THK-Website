import Link from '../components/LocaleLink'
import { FaArrowRight } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Picture from '../components/Picture'
import { site, temple, templeBoard } from '../data/site'
import { photos, gallery } from '../data/photos'
import { useT } from '../i18n/useT'

const Community = () => {
  const t = useT()
  /**
   * The Devasthanam gets its own @id here rather than being buried in the page
   * description. It is a well-known entity in its own right, and naming it as a
   * distinct organisation — with his membership pointing at it — is what lets a
   * search or answer engine connect "who is on the Kanaka Durga temple board"
   * to this page.
   */
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${site.url}/community#webpage`,
        name: 'Trust Board Member, Sri Durga Malleswara Swamy Varla Devasthanam',
        url: `${site.url}/community`,
        about: { '@id': `${site.url}/#devasthanam` },
        isPartOf: { '@id': `${site.url}/#website` },
        /*
         * The press reports behind the appointment record on this page.
         *
         * `citation` sits on the WebPage, not on the Person. That is deliberate
         * and it is the honest placement: these articles are about the trust
         * board -- its constitution, its chairman, its swearing-in, its member
         * list -- and not about him. Hanging them off the Person as `subjectOf`
         * would tell a search engine they are coverage OF HIM, which would
         * overstate what they say. See the note on templeBoard in
         * src/data/site.js.
         */
        citation: templeBoard.sources.map((src) => ({
          '@type': 'NewsArticle',
          headline: src.title,
          url: src.url,
          publisher: { '@type': 'Organization', name: src.label },
        })),
      },
      {
        '@type': ['PlaceOfWorship', 'Organization'],
        '@id': `${site.url}/#devasthanam`,
        name: temple.officialName,
        description: temple.significance,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Indrakeeladri Hill',
          addressLocality: 'Vijayawada',
          addressRegion: 'Andhra Pradesh',
          addressCountry: 'IN',
        },
        // The chairman is named so a reader -- or a model -- cannot infer that
        // he chairs the board. He does not.
        alternateName: [temple.popularName, 'Kanaka Durga Temple', 'Indrakeeladri Temple'],
        member: {
          '@type': 'OrganizationRole',
          '@id': `${site.url}/#devasthanam-board-role`,
          roleName: 'Trust Board Member',
          description: 'One of seventeen members of the trust board alongside its chairman, not the chairman.',
          startDate: '2025-10-11',
          member: { '@id': `${site.url}/#person` },
        },
      },
    ],
  }

  // Square tiles, so anything near-panoramic is excluded rather than butchered:
  // endowments-minister-anam is 1280x577 (2.22:1) and a square centre crop threw
  // away 66% of its width, which on a two-person photograph removes one of them.
  // The page banner is excluded too — it was reappearing as the fourth tile of
  // the same page.
  const templePhotos = gallery.filter(
    (g) =>
      (g.group === 'temple' || g.group === 'culture') &&
      g.slug !== photos.bannerCommunity.slug &&
      g.width / g.height < 1.6
  )

  return (
    <>
      <Seo
        title="Board Member, Sri Durga Malleswara Swamy Varla Devasthanam"
        description="Board Member of the Sri Durga Malleswara Swamy Varla Devasthanam (Kanaka Durga Temple), Indrakeeladri — governance and devotee services."
        schema={schema}
        preloadPhoto={{ ...photos.bannerCommunity, sizes: '100vw' }}
      />

      <PageHero
        eyebrow="Trust Board Member · Sri Kanaka Durga Devasthanam"
        title="Sri Durga Malleswara Swamy Varla Devasthanam"
        // A short lead, not temple.intro. That runs to 322 characters against
        // roughly 100 for every other hero, so it pushed the copy to 83% of the
        // band and left no photograph visible below it. temple.intro moved into
        // the body section below, which was its only other home — dropping it
        // from the hero alone would have removed it from the site.
        lead="Talikota Hari Krishna serves on the trust board of the Sri Kanaka Durga Temple at Indrakeeladri, Vijayawada — governance, devotee facilities and the continuity of tradition."
        photo={photos.bannerCommunity}
      />

      {/* ---- The temple ---------------------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow">{t("Indrakeeladri, Vijayawada")}</p>
              <h2 className="mt-5 font-display text-display">{t(temple.popularName)}</h2>
              <div className="mt-8 space-y-5 text-lead text-ink-600">
                <p>{t(temple.intro)}</p>
                <p>{t(temple.significance)}</p>
                <p>{t(temple.history)}</p>
              </div>
              <p lang="te" className="mt-7 border-l-2 border-brand-500 pl-5 text-ink-700">
                శ్రీ దుర్గా మల్లేశ్వర స్వామి వార్ల దేవస్థానం, ఇంద్రకీలాద్రి, విజయవాడ
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-5">
              <dl className="divide-y hairline border-y hairline">
                {[
                  ['Official name', temple.officialName],
                  ['Also known as', temple.popularName],
                  ['Deity', temple.deity],
                  ['Location', temple.location],
                  ['River', temple.river],
                  ['Significance', 'Widely revered as a Shakti Peetha'],
                  ['Governing body', 'Trust board, under the A.P. Endowments Department'],
                  ['His role', 'Trust Board Member — one of several members, not the chairman'],
                ].map(([term, desc]) => (
                  <div key={term} className="grid grid-cols-[7.5rem_1fr] gap-4 py-4">
                    <dt className="font-sans text-micro uppercase text-ink-500">{t(term)}</dt>
                    <dd className="text-sm text-ink-800">{t(desc)}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Governance ---------------------------------------------------- */}
      <section className="bg-ink-950 py-20 lg:py-28">
        <div className="on-dark container-custom">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">{t("How the Devasthanam is run")}</p>
              <h2 className="mt-5 font-display text-title text-white">
                {t("Trust board governance")}
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <p className="text-lead text-white/70">{t(temple.governance)}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- The appointment, with its sources ------------------------------
          The office's point, and it was a fair one: the site asserted the board
          seat everywhere and never once told a reader WHICH board, appointed
          when, by whom, or where to check it. "Devasthanam Board Member" on its
          own identifies nobody. This is the record.

          The citations are about the BOARD -- its constitution, its chairman,
          its swearing-in, its published member list. They are captioned that
          way and not as proof of identity, because no published report spells
          the surname beside the seat. See the long note on templeBoard in
          src/data/site.js before changing this. */}
      <section id="appointment" className="section scroll-mt-24 bg-ink-50">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">{t('The Appointment')}</p>
              <h2 className="mt-5 font-display text-display">{t('The seat, and the record')}</h2>
              <p className="mt-7 text-lead text-ink-600">
                {t(
                  `Sworn in on ${templeBoard.sworn} before the Rajagopuram on Indrakeeladri, as one of seventeen members of the trust board alongside its chairman.`
                )}
              </p>
              <p className="mt-5 text-ink-600">
                {t(templeBoard.footfall.value)}.{' '}
                <span className="text-ink-500">{t(templeBoard.footfall.attribution)}.</span>
              </p>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7">
              <dl className="divide-y hairline border-y hairline">
                {templeBoard.facts.map(([term, desc]) => (
                  <div key={term} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                    <dt className="font-sans text-micro uppercase text-ink-500">{t(term)}</dt>
                    <dd className="text-sm font-medium leading-relaxed text-ink-900">{t(desc)}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8">
                <p className="font-sans text-micro uppercase text-ink-500">
                  {t('Reported by')}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {templeBoard.sources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex max-w-full items-baseline gap-2 text-sm text-ink-700 hover:text-ink-900"
                      >
                        <span className="font-semibold underline underline-offset-4">
                          {t(src.label)}
                        </span>
                        <span className="min-w-0 text-ink-500">
                          {src.title} · {t(src.date)}
                          <span className="sr-only"> {t('(opens in a new tab)')}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Board responsibilities ---------------------------------------- */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t("The Role")}</p>
            <h2 className="mt-5 font-display text-display">{t("What board service covers")}</h2>
          </Reveal>

          <ul className="mt-14 border-t hairline">
            {temple.duties.map((duty, i) => (
              <Reveal as="li" key={duty.title} delay={i * 0.06} className="border-b hairline">
                <div className="grid gap-x-10 gap-y-4 py-9 lg:grid-cols-[4rem_18rem_1fr] lg:py-11">
                  <span className="index-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-headline text-ink-900">{t(duty.title)}</h3>
                  <ul className="space-y-2.5 lg:pt-1">
                    {duty.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-ink-600">
                        <span
                          className="mt-[0.6rem] h-px w-3 shrink-0 bg-brand-600"
                          aria-hidden="true"
                        />
                        <span className="text-[0.95rem] leading-relaxed">{t(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Devotee services ---------------------------------------------- */}
      <section className="section bg-ink-50">
        <div className="container-custom">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">{t("For Devotees")}</p>
              <h2 className="mt-5 font-display text-title">{t("Services the board oversees")}</h2>
              <p className="mt-6 text-ink-600">
                {t("The Devasthanam receives millions of devotees a year, and the practical experience of those visits — the queue, the meal, the bed for the night — is what board oversight ultimately answers for.")}
              </p>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <dl className="divide-y hairline border-y hairline">
                {temple.services.map((s) => (
                  <div key={s.name} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                    <dt className="font-sans text-sm font-semibold text-ink-900">{t(s.name)}</dt>
                    <dd className="text-[0.95rem] leading-relaxed text-ink-600">{t(s.note)}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Festivals ------------------------------------------------------ */}
      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t("Temple Calendar")}</p>
            <h2 className="mt-5 font-display text-display">{t("Major observances")}</h2>
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {temple.festivals.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.06} className="border-t hairline pt-6">
                <h3 className="font-display text-headline text-ink-900">{t(f.name)}</h3>
                <p className="mt-3 leading-relaxed text-ink-600">{t(f.note)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Photographs ---------------------------------------------------- */}
      {templePhotos.length > 0 && (
        <section className="bg-ink-950 py-20 lg:py-28">
          <div className="on-dark container-custom">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">{t("In Pictures")}</p>
                <h2 className="mt-5 font-display text-display text-white">
                  {t("Temple & tradition")}
                </h2>
              </div>
              <Link
                to="/media"
                className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:text-brand-300"
              >
                {t('Full gallery')}
                <FaArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>

            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templePhotos.slice(0, 3).map((item, i) => (
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
                    <p className="mt-4 text-sm leading-snug text-white/65 transition-colors group-hover:text-white">
                      {t(item.caption)}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

export default Community
