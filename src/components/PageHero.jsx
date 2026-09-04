import { motion, useReducedMotion } from 'framer-motion'
import Picture from './Picture'

/**
 * Shared page header.
 *
 * Two modes:
 *  - with `photo`: a full-bleed image with a bottom scrim and the title over it
 *  - without: a dark editorial band
 *
 * Both sit under the fixed header (the negative top margin), so inner pages
 * open on the same full-bleed rhythm as the homepage instead of a flat
 * coloured box with centred text.
 */
const PageHero = ({ eyebrow, title, lead, photo, children }) => {
  const reduce = useReducedMotion()

  const rise = (i) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] },
        }

  return (
    <section className="relative isolate -mt-[var(--nav-h)] flex min-h-[62vh] items-end overflow-hidden bg-ink-950 lg:min-h-[70vh]">
      {photo && (
        <div className="absolute inset-0">
          <Picture
            photo={photo}
            rounded=""
            aspect="auto"
            priority
            sizes="100vw"
            className="!absolute inset-0 h-full w-full"
            imgClassName={reduce ? '' : 'animate-slow-zoom'}
          />
          <div className="absolute inset-0 scrim-bottom" aria-hidden="true" />
        </div>
      )}

      <div className="on-dark container-custom relative z-10 pb-14 pt-32 sm:pb-20">
        <div className="max-w-3xl">
          {eyebrow && (
            <motion.p {...rise(0)} className="label-rule !text-brand-400 before:!bg-brand-500">
              {eyebrow}
            </motion.p>
          )}
          <motion.h1 {...rise(1)} className="mt-6 font-display text-display text-white">
            {title}
          </motion.h1>
          {lead && (
            <motion.p {...rise(2)} className="mt-6 max-w-2xl text-lead text-white/75">
              {lead}
            </motion.p>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}

export default PageHero
