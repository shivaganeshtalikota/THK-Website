import { useState } from 'react'

/**
 * Responsive image.
 *
 * Serves WebP via srcset with a JPEG fallback, so a phone on a Telangana
 * mobile network pulls the 480px variant (~15-40KB) instead of the 1800px one.
 *
 * width/height are always emitted so the browser reserves the right box before
 * the bytes arrive — without them each image shifts the page as it loads (a
 * Cumulative Layout Shift penalty that Core Web Vitals measures directly).
 *
 * If a file is missing it falls back to a branded panel rather than a broken
 * image icon — the same guarantee the placeholder gave before real photography
 * existed.
 */
const Picture = ({
  photo,
  className = '',
  imgClassName = '',
  sizes = '100vw',
  priority = false,
  rounded = 'rounded-3xl',
  aspect,
}) => {
  const [failed, setFailed] = useState(false)

  const srcSet = photo.widths
    .map((w) => `/photos/${photo.slug}-${w}.webp ${w}w`)
    .join(', ')

  const ratio = aspect ?? `${photo.width} / ${photo.height}`

  if (failed) {
    return (
      <div
        className={`bg-brand-texture relative grid place-items-center overflow-hidden ${rounded} ${className}`}
        style={{ aspectRatio: ratio }}
        role="img"
        aria-label={photo.alt}
      >
        <span
          className="font-heading text-5xl font-extrabold tracking-tighter text-ink-900/25"
          aria-hidden="true"
        >
          HKT
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-ink-100 ${rounded} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <picture>
        <source type="image/webp" srcSet={srcSet} sizes={sizes} />
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          onError={() => setFailed(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          // Lowercase: React 18 does not map the camelCase `fetchPriority`
          // prop and warns, dropping the attribute entirely.
          fetchpriority={priority ? 'high' : 'auto'}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      </picture>
    </div>
  )
}

export default Picture
