import { useEffect, useState } from 'react'
import { loadPosterFont } from '../lib/renderPoster'

/**
 * A grid of fonts, each showing the sample text set in that font, so the
 * office picks by looking rather than by name. The faces load when the grid
 * first shows (they are only needed here and on posters that use them).
 */
export default function FontPicker({ fonts, value, onChange, sample, sameOption = null }) {
  const [, setLoaded] = useState(0)
  useEffect(() => {
    let alive = true
    fonts.forEach((f) =>
      loadPosterFont(f.id).then(() => {
        // Re-render as each face arrives, so tiles stop showing the fallback.
        if (alive) setLoaded((n) => n + 1)
      }),
    )
    return () => {
      alive = false
    }
  }, [fonts])

  const tile = (active) =>
    `rounded-lg border bg-white p-2.5 text-left transition ${active ? 'border-ink-900 ring-2 ring-ink-900/10' : 'border-ink-200 hover:border-ink-400'}`

  return (
    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
      {sameOption && (
        <button type="button" onClick={() => onChange('same')} className={tile(value === 'same')}>
          <span className="block text-sm font-semibold leading-snug text-ink-900">{sameOption}</span>
          <span className="mt-0.5 block text-[0.68rem] text-ink-500">English letters from the Telugu font</span>
        </button>
      )}
      {fonts.map((f) => (
        <button key={f.id} type="button" onClick={() => onChange(f.id)} className={tile(value === f.id)} title={f.note}>
          <span className="block truncate text-lg leading-snug text-ink-900" style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}>
            {sample}
          </span>
          <span className="mt-0.5 block truncate text-[0.68rem] text-ink-500">
            {f.label} · {f.note}
          </span>
        </button>
      ))}
    </div>
  )
}
