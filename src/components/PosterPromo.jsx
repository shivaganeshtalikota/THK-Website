import { FaArrowRight } from 'react-icons/fa6'
import Link from './LocaleLink'
import Reveal from './Reveal'
import { posters, posterCard } from '../data/posters'
import { useT } from '../i18n/useT'

/**
 * The poster maker, offered from the home page.
 *
 * The poster pages were reachable only from the menu, and the home page — where
 * most visitors land from a shared link or a search — never mentioned them.
 * This is one band, in party yellow so it reads as a call to act rather than
 * another section to read, with the lead campaign's social card beside it.
 * The card is the light 1200x630 file (about 160KB), not the full artwork.
 */
const PosterPromo = () => {
  const t = useT()
  const lead = posters[0]
  if (!lead) return null

  return (
    <section className="on-brand bg-brand-500">
      <div className="container-custom grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
        <Reveal className="lg:col-span-5">
          <p className="label-rule !text-ink-800 before:!bg-ink-900/40">{t('Campaign Material')}</p>
          <h2 className="mt-6 font-display text-display text-ink-900">{t('Create your own poster')}</h2>
          <p lang="te" className="mt-4 font-poster text-2xl font-extrabold leading-snug text-ink-900">
            మీ పేరు. మీ ఫోటో. మీ పోస్టర్.
          </p>
          <p className="mt-5 max-w-xl text-lead text-ink-800">
            {t(
              'Pick a campaign, add your photo and your name, and download a poster ready to share. It takes under a minute, it works on a phone, and your photograph never leaves your device.',
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/posters/${lead.slug}`} className="btn-primary">
              {t('Make my poster')} <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/posters" className="btn-outline">
              {t('See all campaigns')}
            </Link>
          </div>
        </Reveal>

        <Reveal variant="fade" delay={0.1} className="lg:col-span-7">
          <Link
            to={`/posters/${lead.slug}`}
            className="group block overflow-hidden rounded-sm shadow-[0_24px_60px_-24px_rgba(10,10,9,0.55)] ring-1 ring-ink-900/10"
            aria-label={t('Make my poster')}
          >
            <img
              src={posterCard(lead)}
              alt={t(`${lead.titleEn} — Telugu Desam Party campaign poster`)}
              width="1200"
              height="630"
              loading="lazy"
              decoding="async"
              className="aspect-[1200/630] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default PosterPromo
