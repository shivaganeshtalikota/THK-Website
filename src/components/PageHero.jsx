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
  aside = null,
  children,
}) => {
  const t = useT()
  /*
   * `aside` fills the right-hand side of a band that would otherwise be half
   * empty — the office's complaint about every text-only header was the black
   * space beside the title. Facts, figures or links; on a phone it simply
   * follows the copy.
   */
  const withAside = (copy) =>
    aside ? (
      <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">{copy}</div>
        <div className="lg:col-span-5">{aside}</div>
      </div>
    ) : (
      copy
    )
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
        {/*
          No top padding here.

          <main> already carries pt-[var(--nav-h)] to clear the fixed masthead
          (src/App.jsx), so padding for it again put a band of bg-ink-950
          exactly one nav-height tall above the photograph — measured at 72px.
          On every other hero the image sits behind the type and absorbs it; on
          this variant the image starts below the padding, so it read as a black
          border across the top of the page.
        */}
        <div className="relative overflow-hidden">
          {/* Taller than the overlay band. Nothing is written over this one, so
                the height is set by what the photograph needs rather than by
                what the type needs: at 30vw the standing speaker's head was
                clipped by the top edge in every crop, because a 3.3:1 letterbox
                shows barely 40% of a 4:3 frame. */}
            {/* About 30% shorter than it was (43vw): at full height the
                photograph filled the first screen and the heading under it
                could not be seen without scrolling. `focus` keeps the face in
                the frame the shorter band leaves. */}
            <div className="relative h-[32vh] min-h-[14rem] sm:h-[36vh] lg:h-[clamp(18rem,30vw,31rem)]">
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
            {/* h-16 on a phone, not h-24: this band is 272px tall there, so a
                96px fade darkened over a third of the photograph and read as
                dead space rather than as a seam. Desktop keeps the fuller
                fade, where the band is three times the height. */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950 to-transparent sm:h-24"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="on-dark container-custom pb-10 pt-6 sm:pb-12 sm:pt-8">{withAside(Copy)}</div>
      </section>
    )
  }

  if (!photo) {
    // No photograph: the band is exactly as tall as what is in it. Sized like
    // a photo banner it was mostly empty black (the office's complaint).
    return (
      <section className="relative isolate overflow-hidden border-b-[6px] border-brand-500 bg-ink-950">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_20%,rgba(255,212,0,0.10),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="on-dark container-custom relative pb-10 pt-8 sm:pb-12 sm:pt-10">{withAside(Copy)}</div>
      </section>
    )
  }

  return (
    <section
      className={`relative isolate flex items-start overflow-hidden border-b-[6px] border-brand-500 bg-ink-950 ${
        compact
          ? 'min-h-[34vh] lg:min-h-[38vh]'
          : 'min-h-[70vh] sm:min-h-[62vh] lg:min-h-0 lg:h-[clamp(30rem,36vw,42rem)]'
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

      {/*
        Breathing room under the masthead, not a second copy of its height.

        This used to add var(--nav-h) on top of the 2rem, but <main> already
        clears the fixed nav (src/App.jsx), so the total came to 104px and the
        heading sat a third of the way down a 386px band — measured — with the
        copy crammed against the bottom edge. The office asked for the type at
        the TOP of the banner, which is also what scrim-top is drawn for.
      */}
      <div className="on-dark container-custom relative z-10 pb-14 pt-8 sm:pb-16 sm:pt-12">
        {Copy}
      </div>
    </section>
  )
}

export default PageHero
