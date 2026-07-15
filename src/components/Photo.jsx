import { useState } from 'react'

/**
 * An image that fails gracefully.
 *
 * If the file named in the photo manifest isn't in /public/images/ yet — or
 * fails to load — this renders a designed, branded panel instead of the
 * browser's broken-image icon. The site therefore looks deliberate today and
 * becomes photographic the moment real files are dropped in.
 *
 * See src/data/images.js for how to supply the real photography.
 */
const Photo = ({ photo, className = '', imgClassName = '', priority = false, rounded = 'rounded-3xl' }) => {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`relative overflow-hidden bg-ink-50 ${rounded} ${className}`}
      style={{ aspectRatio: photo.aspect }}
    >
      {!failed ? (
        <img
          src={photo.src}
          alt={photo.alt}
          onError={() => setFailed(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          // Lowercase: React 18 doesn't map the camelCase `fetchPriority` prop
          // and warns, leaving the attribute off the element entirely.
          fetchpriority={priority ? 'high' : 'auto'}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <Placeholder />
      )}
    </div>
  )
}

/** Branded stand-in: monogram over the party yellow, with a soft grid. */
const Placeholder = () => (
  <div
    className="bg-brand-texture flex h-full w-full items-center justify-center"
    role="img"
    aria-label="Photograph pending"
  >
    <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
    <div className="relative flex flex-col items-center gap-3 px-6 text-center">
      <span
        className="font-heading text-6xl font-extrabold tracking-tighter text-ink-900/25 sm:text-7xl"
        aria-hidden="true"
      >
        HKT
      </span>
      <span className="font-heading text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-900/45">
        Photograph pending
      </span>
    </div>
  </div>
)

export default Photo
