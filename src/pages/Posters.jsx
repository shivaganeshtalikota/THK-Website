import Link from '../components/LocaleLink'
import { FaArrowRight, FaCircleCheck } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PostersHero from '../components/PostersHero'
import Reveal from '../components/Reveal'
import { site } from '../data/site'
import { posters, posterImage, posterCard } from '../data/posters'
import { useT } from '../i18n/useT'

/**
 * The campaign posters a supporter can put their own name and face on.
 *
 * The point of the page is reach: one artwork, shared by a thousand workers
 * each carrying their own name, travels further than the same artwork posted
 * once from an official account. Everything here is built around getting
 * somebody from "what is 22A?" to a finished JPG in their gallery in under a
 * minute, on a phone.
 */
/*
 * The card a link to this page previews as.
 *
 * Module scope, not an object literal in the JSX: Seo keys its head block on
 * this prop's identity, and a fresh object each render would re-apply every
 * meta tag on the page for nothing.
 *
 * The listing borrows the lead campaign's card rather than carrying one of its
 * own. There is one poster; a separate generic card would be an extra file
 * saying less. When a second campaign lands this should become a card of its
 * own showing several.
 */
const LISTING_CARD = {
  url: `${site.url}${posterCard(posters[0])}`,
  width: 1200,
  height: 630,
  alt: posters[0].titleEn,
}

const Posters = () => {
  const t = useT()

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${site.url}/posters#webpage`,
        name: 'Create your own poster',
        url: `${site.url}/posters`,
        isPartOf: { '@id': `${site.url}/#website` },
        about: { '@id': `${site.url}/#person` },
      },
    ],
  }

  return (
    <>
      <Seo
        title="Create Your Own Poster"
        description="Put your own name, designation and photo on a Telugu Desam Party campaign poster, and share it. Free, works on a phone, and your photo never leaves your device."
        image={LISTING_CARD}
        schema={schema}
      />

      <PostersHero posters={posters} />

      <section id="campaigns" className="section scroll-mt-[var(--nav-h)] bg-white">
        <div className="container-custom">
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('Current Campaigns')}</p>
              <h2 className="mt-5 font-display text-display">{t('Choose a poster')}</h2>
            </div>
            <p className="text-lead text-ink-600 lg:col-span-7">
              {t(
                'More will be added as campaigns run. Tap a poster to put your name on it.'
              )}
            </p>
          </Reveal>

          {/* One campaign: a wide card, poster beside its story. A single
              third-width tile left two-thirds of the row empty. */}
          <ul className={`mt-12 grid gap-8 ${posters.length === 1 ? '' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {posters.map((poster, i) => (
              <Reveal as="li" key={poster.slug} delay={Math.min(i, 5) * 0.06}>
                <Link
                  to={`/posters/${poster.slug}`}
                  className={`tap-round group block overflow-hidden rounded-sm border hairline bg-white transition-colors hover:border-ink-900 ${
                    posters.length === 1 ? 'md:grid md:grid-cols-12' : ''
                  }`}
                >
                  <div className={`relative overflow-hidden bg-ink-100 ${posters.length === 1 ? 'md:col-span-5' : ''}`}>
                    <img
                      src={posterImage(poster)}
                      alt={t(`${poster.titleEn} — Telugu Desam Party campaign poster`)}
                      width={poster.width}
                      height={poster.height}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 bg-brand-500 px-2.5 py-1 font-sans text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink-900">
                      {poster.issue}
                    </span>
                  </div>

                  <div className={posters.length === 1 ? 'p-6 sm:p-10 md:col-span-7 md:self-center' : 'p-5'}>
                    <p
                      lang="te"
                      className={`font-display font-semibold leading-snug text-ink-900 ${posters.length === 1 ? 'text-2xl sm:text-3xl' : 'text-base'}`}
                    >
                      {poster.title}
                    </p>
                    {posters.length === 1 && poster.date && (
                      <p className="mt-3 font-sans text-micro uppercase text-brand-800">{t(poster.date)}</p>
                    )}
                    <p className={`mt-3 leading-relaxed text-ink-600 ${posters.length === 1 ? 'text-lead' : 'text-sm'}`}>
                      {t(poster.summary)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-brand-800">
                      {t('Create your poster')}
                      <FaArrowRight
                        className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* A plain statement of what happens to their photo. Asking somebody to
          use a picture of their own face is asking for trust, and the honest
          answer is unusually good — the photo is processed in the browser and
          never uploaded — so it is stated rather than buried in a privacy page.
          (It said "Nothing is uploaded" until finished posters started being
          saved for shared links; the heading now says only what is true.) */}
      <section className="bg-ink-950 py-16 lg:py-20">
        <div className="on-dark container-custom grid gap-10 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow">{t('Your photo')}</p>
            <h2 className="mt-5 font-display text-title text-white">
              {t('Your photo stays with you')}
            </h2>
            <p className="mt-6 text-lead text-white/70">
              {t(
                'The poster is built inside your own browser, and there is no account. Your photograph is never sent to this website or to anyone else. When you generate a poster, the finished poster is saved so the link you share can show it, and it is deleted after 30 days.'
              )}
            </p>
          </Reveal>
          <Reveal delay={0.1} as="ul" className="grid gap-3 lg:col-span-5">
            {['No account, no sign-up', 'Your photo is processed on your phone', 'Shared posters are deleted after 30 days'].map((x) => (
              <li key={x} className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-white">
                <FaCircleCheck className="shrink-0 text-brand-400" aria-hidden="true" />
                {t(x)}
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Posters
