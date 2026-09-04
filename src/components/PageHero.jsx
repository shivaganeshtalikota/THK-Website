import Reveal from './Reveal'
import Picture from './Picture'

/**
 * Shared page header.
 *
 * Two modes:
 *  - with `photo`: a full-bleed image with a bottom scrim and the title over it
 *  - without: a dark editorial band
 *
 * `focus` sets object-position so each banner crops around its subject —
 * without it a tall portrait cropped to a wide band cuts faces in half.
 */
const PageHero = ({ eyebrow, title, lead, photo, focus, children }) => {
  return (
    <section className="relative isolate flex min-h-[46vh] items-end overflow-hidden bg-ink-950 lg:min-h-[56vh]">
      {photo && (
        <div className="absolute inset-0">
          <Picture
            photo={photo}
            rounded=""
            aspect="auto"
            priority
            sizes="100vw"
            className="!absolute inset-0 h-full w-full"
            imgClassName={`${focus ?? 'object-center'} animate-slow-zoom`}
          />
          <div className="absolute inset-0 scrim-bottom" aria-hidden="true" />
        </div>
      )}

      <div className="on-dark container-custom relative z-10 pb-12 pt-20 sm:pb-16 sm:pt-24">
        <div className="max-w-3xl">
          {eyebrow && (
            <Reveal as="p" delay={0.05} className="label-rule !text-brand-400 before:!bg-brand-500">
              {eyebrow}
            </Reveal>
          )}
          <Reveal as="h1" delay={0.13} className="mt-6 font-display text-display text-white">
            {title}
          </Reveal>
          {lead && (
            <Reveal as="p" delay={0.21} className="mt-6 max-w-2xl text-lead text-white/75">
              {lead}
            </Reveal>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}

export default PageHero
