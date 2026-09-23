import { Children, cloneElement, isValidElement, useEffect, useId, useState } from 'react'
import { FaCircleCheck, FaTriangleExclamation, FaCircleInfo, FaXmark } from 'react-icons/fa6'
import { waitForLive } from './api'

/**
 * The panel's small vocabulary of parts. Kept in one file so every page looks
 * and behaves the same — the same field, the same button, the same way of
 * saying "saved" or "that did not work" — which matters more to somebody
 * using this twice a week than any single page being clever.
 */

export const inputCls =
  'mt-1.5 w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 disabled:bg-ink-50 disabled:text-ink-400'

/**
 * A labelled field. A single control inside is linked to the label (so
 * tapping the label focuses it and screen readers announce it); several
 * controls are grouped under the label instead.
 */
export function Field({ label, hint, children, className = '', htmlFor }) {
  const auto = useId()
  const only = Children.count(children) === 1 && isValidElement(children) && typeof children.type === 'string'
  const id = htmlFor || (only ? children.props.id || auto : undefined)
  const hintId = hint ? `${auto}-hint` : undefined
  if (!id) {
    return (
      <div className={className} role="group" aria-labelledby={`${auto}-label`}>
        <p id={`${auto}-label`} className="block text-[0.8rem] font-semibold text-ink-700">
          {label}
        </p>
        {children}
        {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{hint}</p>}
      </div>
    )
  }
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[0.8rem] font-semibold text-ink-700">
        {label}
      </label>
      {only ? cloneElement(children, { id, 'aria-describedby': hintId }) : children}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink-500">
          {hint}
        </p>
      )}
    </div>
  )
}

export function Button({ variant = 'primary', busy = false, className = '', children, ...rest }) {
  const styles = {
    primary: 'bg-ink-900 text-white hover:bg-ink-800',
    brand: 'bg-brand-500 text-ink-900 hover:bg-brand-400',
    ghost: 'border border-ink-200 bg-white text-ink-800 hover:border-ink-400',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  }
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-ink-200/80 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-[0.95rem] font-semibold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.9rem] font-bold leading-tight text-ink-950">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', children, onClose }) {
  const t = {
    ok: ['border-emerald-200 bg-emerald-50 text-emerald-900', FaCircleCheck],
    error: ['border-red-200 bg-red-50 text-red-800', FaTriangleExclamation],
    warn: ['border-amber-200 bg-amber-50 text-amber-900', FaTriangleExclamation],
    info: ['border-ink-200 bg-ink-50 text-ink-700', FaCircleInfo],
  }[tone]
  const Icon = t[1]
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${t[0]}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
          <FaXmark aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function Progress({ value, label }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="flex items-center justify-between text-xs font-medium text-ink-600">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-200" style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
    </div>
  )
}

/**
 * "Published — live on the site in a minute or two", which then turns into
 * "Live now" when the deployment carrying this commit is being served.
 */
export function LiveStatus({ commit, message, link }) {
  const [state, setState] = useState('waiting')
  useEffect(() => {
    let alive = true
    setState('waiting')
    waitForLive(commit).then((ok) => alive && setState(ok ? 'live' : 'slow'))
    return () => {
      alive = false
    }
  }, [commit])

  if (state === 'live') {
    return (
      <Notice tone="ok">
        <strong>Live on the website now.</strong>{' '}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
            Open it
          </a>
        )}
      </Notice>
    )
  }
  if (state === 'slow') {
    return (
      <Notice tone="warn">
        Saved. The website is taking longer than usual to update — it will appear shortly. Nothing more to do.
      </Notice>
    )
  }
  return (
    <Notice tone="ok">
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" aria-hidden="true" />
        {message || 'Saved.'} Updating the website — usually one to two minutes.
      </span>
    </Notice>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      {Icon && <Icon className="text-3xl text-ink-300" aria-hidden="true" />}
      <p className="mt-3 font-semibold text-ink-800">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-sm text-ink-500">{children}</div>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <span className="relative inline-block h-6 w-11">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="absolute inset-0 rounded-full bg-ink-200 transition peer-checked:bg-emerald-600" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span className="text-sm font-medium text-ink-800">{label}</span>
    </label>
  )
}
