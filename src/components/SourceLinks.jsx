import { useState } from 'react'
import { FaArrowUpRightFromSquare } from 'react-icons/fa6'
import { useT } from '../i18n/useT'

/**
 * Press citations for a photograph or an update.
 *
 * Shows the first source and, if there are more, a "+2" that expands the rest
 * in place. A stack of five outlet names under every caption drowns the caption
 * itself; one plus a count reads as "this is sourced" without taking the page
 * over, and the rest are one click away.
 *
 * Every link carries rel="noopener noreferrer" and an explicit new-tab warning
 * for screen readers — these point off-site to news outlets.
 */
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const linkCls =
  'inline-flex max-w-full items-center gap-1.5 truncate underline underline-offset-4 transition-colors'

const SourceLinks = ({ sources, tone = 'light', className = '' }) => {
  const [expanded, setExpanded] = useState(false)
  const t = useT()
  const list = (sources ?? []).filter((s) => s?.url)
  if (list.length === 0) return null

  const dark = tone === 'dark'
  const base = dark ? 'text-white/70 hover:text-white' : 'text-ink-600 hover:text-ink-900'
  const accent = dark ? 'text-brand-400 hover:text-brand-300' : 'text-brand-800 hover:text-ink-900'

  const shown = expanded ? list : list.slice(0, 1)

  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs ${base} ${className}`}>
      <span className={dark ? 'text-white/45' : 'text-ink-500'}>{t('Source')}</span>
      {shown.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkCls} ${accent}`}
        >
          {s.label?.trim() || hostOf(s.url)}
          <FaArrowUpRightFromSquare className="shrink-0 text-[0.65em]" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
      {list.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`font-semibold ${accent} underline underline-offset-4`}
        >
          {expanded ? 'Show less' : `+${list.length - 1}`}
        </button>
      )}
    </p>
  )
}

export default SourceLinks
