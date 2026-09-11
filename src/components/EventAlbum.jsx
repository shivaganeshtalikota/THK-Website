import Picture from './Picture'
import Reveal from './Reveal'
import SourceLinks from './SourceLinks'
import { albumFrames } from '../data/albums'
import { useT, useLang } from '../i18n/useT'

/**
 * One event, told once.
 *
 * The office asked for ten photographs of a single bike rally to go on the site
 * without becoming ten rows in the gallery, and that is the whole design here:
 * a lead frame at the size the moment deserves, the party's own account beside
 * it, and the remaining frames as a contact strip underneath. The set reads as
 * a record of an afternoon rather than as a pile of pictures.
 *
 * THE TELUGU IS THE SOURCE, NOT A TRANSLATION
 * This event was published by the Telangana TDP page in Telugu. That wording is
 * quoted verbatim on the Telugu side of the site rather than round-tripped
 * through English, so a Telugu reader gets the party's actual sentences. The
 * English is the rendering, not the other way round.
 *
 * Every frame opens the same viewer the gallery uses — `onOpen` hands the index
 * back up so the page can pass this album's own set to it.
 */
const EventAlbum = ({ album, onOpen }) => {
  const t = useT()
  const lang = useLang()
  const frames = albumFrames(album)
  const [lead, ...rest] = frames

  const title = lang === 'te' ? album.teluguTitle : album.title
  const body = lang === 'te' ? album.telugu : album.summary
  const remarks = lang === 'te' ? album.teluguRemarks : album.remarks

  return (
    <section id={album.slug} className="section scroll-mt-24 bg-ink-950">
      <div className="on-dark container-custom">
        <Reveal className="max-w-3xl">
          <p className="label-rule !text-brand-400 before:!bg-brand-500">
            {t(album.dateLabel)} · {t(album.place)}
          </p>
          <h2 className="mt-6 font-display text-display text-white">{title}</h2>
          <p className="mt-6 text-lead text-white/75">{body}</p>
        </Reveal>

        {/* The lead frame, at the size the moment deserves. */}
        <Reveal delay={0.1} className="mt-12">
          <button
            type="button"
            onClick={() => onOpen(0)}
            className="group block w-full text-left"
            aria-label={`${t('Open photo')}: ${lead.alt}`}
          >
            <div className="overflow-hidden">
              <Picture
                photo={lead}
                rounded=""
                sizes="(max-width: 1024px) 92vw, 78vw"
                imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
          </button>
        </Reveal>

        {/* The rest as a contact strip. Three up on a phone so the whole set is
            visible without scrolling past it; five up from lg. */}
        <Reveal delay={0.16} className="mt-3">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {rest.map((f, i) => (
              <li key={f.slug}>
                <button
                  type="button"
                  onClick={() => onOpen(i + 1)}
                  className="group block w-full text-left"
                  aria-label={`${t('Open photo')}: ${f.alt}`}
                >
                  <div className="overflow-hidden">
                    <Picture
                      photo={f}
                      aspect="3 / 2"
                      rounded=""
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 23vw, 16vw"
                      imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          {remarks && (
            <Reveal delay={0.2} className="lg:col-span-7">
              <p className="border-l-2 border-brand-500 pl-5 text-white/70">{remarks}</p>
            </Reveal>
          )}

          <Reveal delay={0.26} className="lg:col-span-5">
            {album.attended?.length > 0 && (
              <>
                <p className="font-sans text-micro uppercase text-white/45">{t('Also present')}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {album.attended.map((n) => t(n)).join(', ')}
                </p>
              </>
            )}

            {/* The post this is all taken from. Everything above — the route,
                the tribute at the statue, who attended — is checkable there in
                one click, which is the point of carrying it. */}
            {album.sources?.length > 0 && (
              <div className="mt-6">
                <SourceLinks sources={album.sources} tone="dark" />
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default EventAlbum
