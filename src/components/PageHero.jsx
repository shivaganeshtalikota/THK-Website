import Reveal from './Reveal'
import Picture from './Picture'
import { useT } from '../i18n/useT'

/**
 * Shared page header.
 *
 * Two modes:
 *  - with `photo`: a full-bleed image with a TOP scrim and the title over it
 *  - without: a dark editorial band
 *
 * The copy sits at the top of the band, under a gradient that is dark at the
 * masthead and fully transparent by the middle. The previous arrangement put it
 * at the bottom behind a bottom-up scrim, which meant the darkest part of the
 * frame was the half containing the photograph's subject, and on a phone the
 * heading crowded straight up against the navigation bar. This way the type sits
 * in a band that is dark because it is meant to be, and the lower half of the
 * photograph is left completely alone.
 *
 * `focus` overrides the photograph's own measured focal point (photo.focus) for
 * this one placement. It is a CSS object-position value, not a class.
 *
 * The band is 52vh / 64vh rather than 46vh / 56vh. That is a legibility fix as
 * much as a design one: the eyebrow + h1 + lead stack is a fixed height, so a
 * taller band pushes it into a lower fraction of the frame, where the scrim is
 * strong. Measured with scripts/audit-images.py — at 56vh the text reached 66%
 * of the band and white type over the brighter photographs fell to 1.3:1; at
 * 64vh the same scrim clears 5.5:1 everywhere.
 */
const PageHero = ({
  eyebrow,
  title,
  lead,
  photo,
  focus,
  compact = false,
  titleBelow = false,
  children,
}) => {
  const t = useT()
  const Copy = (
    <div className="max-w-none">
      {eyebrow && (
        <Reveal as="p" delay={0.05} className="label-rule !text-brand-400 before:!bg-brand-500">
          {t(eyebrow)}
        </Reveal>
      )}
      <Reveal
        as="h1"
        delay={0.13}
        className="display-wrap mt-6 max-w-none font-display text-[clamp(1.75rem,1.1rem+2.5vw,3.5rem)] font-bold tracking-[-0.02em] text-white"
      >
        {t(title)}
      </Reveal>
      {lead && (
        <Reveal as="p" delay={0.21} className="mt-6 max-w-3xl text-lead text-white/80">
          {t(lead)}
        </Reveal>
      )}
      {children}
    </div>
  )

  /*
   * titleBelow: the photograph gets the whole band and the copy sits under it.
   *
   * Used where the subject's face lands exactly where the heading goes, which
   * is the case on /about — no focal point fixes that, because the type and the
   * face want the same pixels. Separating them is the only real answer, and it
   * also lets the photograph be seen undarkened, since nothing is set over it.
   */
  if (photo && titleBelow) {
    return (
      <section className="border-b-[6px] border-brand-500 bg-ink-950">
        <div className="relative overflow-hidden pt-[var(--nav-h)]">
          {/* Taller than the overlay band. Nothing is written over this one, so
                the height is set by what the photograph needs rather than by
                what the type needs: at 30vw the standing speaker's head was
                clipped by the top edge in every crop, because a 3.3:1 letterbox
                shows barely 40% of a 4:3 frame. */}
            <div className="relative h-[42vh] min-h-[17rem] sm:h-[46vh] lg:h-[clamp(24rem,43vw,44rem)]">
            <Picture
              photo={photo}
              rounded=""
              aspect="auto"
              priority
              sizes="100vw"
              className="!absolute inset-0 h-full w-full"
              position={focus}
              imgClassName="animate-slow-zoom"
            />
            {/* Only a foot-fade, to seat the photograph on the dark ground
                below it. Nothing is written over the image, so it needs no
                scrim of its own. */}
            <div
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="on-dark container-custom pb-16 pt-10 sm:pt-12">{Copy}</div>
      </section>
    )
  }

  return (
    <section
      className={`relative isolate flex items-start overflow-hidden border-b-[6px] border-brand-500 bg-ink-950 ${
        compact
          ? 'min-h-[34vh] lg:min-h-[38vh]'
          : 'min-h-[78vh] sm:min-h-[70vh] lg:min-h-0 lg:h-[clamp(34rem,40vw,46rem)]'
      }`}
    >
      {photo && (
        <div className="absolute inset-0">
          <Picture
            photo={photo}
            rounded=""
            aspect="auto"
            priority
            sizes="100vw"
            className="!absolute inset-0 h-full w-full"
            position={focus}
            imgClassName="animate-slow-zoom"
          />
          <div className="absolute inset-0 scrim-top" aria-hidden="true" />
        </div>
      )}

      {/* pt clears the fixed masthead explicitly rather than by eye — the
          heading was touching the navigation on short viewports. */}
      <div className="on-dark container-custom relative z-10 pb-16 pt-[calc(var(--nav-h)+2rem)] sm:pt-[calc(var(--nav-h)+3rem)]">
        {Copy}
      </div>
    </section>
  )
}

export default PageHero
