import { useRef } from 'react'

/**
 * Drag-and-resize boxes laid over the poster preview.
 *
 * Each box is in FRACTIONS of the poster (x, y, w, h in 0..1), the same units
 * the renderer and the manifest use, so what the office drags is exactly what
 * every supporter's poster uses. Drag inside a box to move it; drag the
 * corner handle to resize it. Pointer events, so it works with a mouse, a
 * trackpad and a finger alike.
 */
const MIN = { photo: 0.08, text: 0.04 }

const clampBox = (b, min) => {
  const w = Math.min(1, Math.max(min, b.w))
  const h = Math.min(1, Math.max(min, b.h))
  return {
    x: Math.min(1 - w, Math.max(0, b.x)),
    y: Math.min(1 - h, Math.max(0, b.y)),
    w,
    h,
  }
}

const round = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10000) / 10000]))

const LayoutOverlay = ({ boxes, onChange }) => {
  const ref = useRef(null)
  const drag = useRef(null)

  const start = (key, mode) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = ref.current.getBoundingClientRect()
    drag.current = { key, mode, rect, from: { x: e.clientX, y: e.clientY }, box: boxes[key] }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.from.x) / d.rect.width
    const dy = (e.clientY - d.from.y) / d.rect.height
    const b = d.box
    const next = d.mode === 'move' ? { ...b, x: b.x + dx, y: b.y + dy } : { ...b, w: b.w + dx, h: b.h + dy }
    onChange(d.key, round(clampBox(next, MIN[d.key])))
  }

  const end = () => {
    drag.current = null
  }

  const box = (k, label, tone) => {
    const b = boxes[k]
    return (
      <div
        key={k}
        role="group"
        aria-label={`${label}: drag to move, drag the corner to resize`}
        onPointerDown={start(k, 'move')}
        className={`absolute cursor-move touch-none rounded-sm border-2 border-dashed ${tone}`}
        style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
      >
        <span className="pointer-events-none absolute left-1 top-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
          {label}
        </span>
        <span
          onPointerDown={start(k, 'resize')}
          className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-ink-950 shadow"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div ref={ref} className="absolute inset-0 select-none" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {box('photo', 'Photo', 'border-sky-400 bg-sky-400/10')}
      {box('text', 'Name', 'border-brand-400 bg-brand-400/10')}
    </div>
  )
}

export default LayoutOverlay
