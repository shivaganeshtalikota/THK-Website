import Link from '../components/LocaleLink'
import { FaArrowRight } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
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

      <PageHero
        eyebrow={t('Campaign Material')}
        title={t('Create your own poster')}
        lead={t(
          'Pick a campaign, add your photo and your name, and download a poster ready to share. It takes under a minute, it works on a phone, and your photograph never leaves your device.'
        )}
      />

      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t('Current Campaigns')}</p>
            <h2 className="mt-5 font-display text-display">{t('Choose a poster')}</h2>
            <p className="mt-6 text-lead text-ink-600">
              {t(
                'More will be added as campaigns run. Tap a poster to put your name on it.'
              )}
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posters.map((poster, i) => (
              <Reveal as="li" key={poster.slug} delay={Math.min(i, 5) * 0.06}>
                <Link
                  to={`/posters/${poster.slug}`}
                  className="tap-round group block overflow-hidden rounded-sm border hairline bg-white transition-colors hover:border-ink-900"
                >
                  <div className="relative overflow-hidden bg-ink-100">
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

                  <div className="p-5">
                    <p lang="te" className="font-display text-base font-semibold leading-snug text-ink-900">
                      {poster.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
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
          upload a picture of their own face is asking for trust, and the honest
          answer here is unusually good — the whole thing runs in the browser —
          so it is stated rather than buried in a privacy page. */}
      <section className="bg-ink-950 py-16 lg:py-20">
        <div className="on-dark container-custom">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">{t('Your photo')}</p>
            <h2 className="mt-5 font-display text-title text-white">
              {t('Nothing is uploaded')}
            </h2>
            <p className="mt-6 text-lead text-white/70">
              {t(
                'The poster is built inside your own browser, and there is no account. Your photograph is never sent to this website or to anyone else. When you generate a poster, the finished poster is saved so the link you share can show it, and it is deleted after 30 days.'
              )}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Posters
