import { party } from '../data/site'

/**
 * The Telugu Desam Party emblem — the cycle, the party's Election Commission
 * symbol — used to mark party affiliation.
 *
 * Served from /tdp-logo.png rather than hotlinked: the CSP is `img-src 'self'`,
 * so an external URL would simply not render, and a party site should not
 * depend on a third party staying up.
 *
 * Intrinsic width/height are set so the space is reserved before the image
 * arrives; without them this shifts the layout on every cold load.
 */
const PartyMark = ({ size = 44, className = '', showName = true, tone = 'dark' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <img
      src="/tdp-logo.png"
      width={size}
      height={size}
      // The emblem is decorative when the party name is written beside it —
      // announcing "Telugu Desam Party logo, Telugu Desam Party" is noise for a
      // screen reader. It only carries the name when it stands alone.
      alt={showName ? '' : `${party.name} emblem`}
      aria-hidden={showName || undefined}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-sm"
      style={{ width: size, height: size }}
    />
    {showName && (
      <span className="leading-tight">
        <span
          className={`block text-sm font-semibold ${
            tone === 'dark' ? 'text-white' : 'text-ink-900'
          }`}
        >
          {party.name}
        </span>
        <span
          className={`block text-xs ${tone === 'dark' ? 'text-ink-400' : 'text-ink-600'}`}
        >
          {party.abbr} · {party.symbol} symbol
        </span>
      </span>
    )}
  </div>
)

export default PartyMark
