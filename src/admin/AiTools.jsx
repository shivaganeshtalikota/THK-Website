import { useState } from 'react'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { aiTranslate } from './ai'

/** The console's Gemini buttons. The calls themselves are in ./ai.js. */

/**
 * "Fill from English" under a Telugu field (or the reverse). Disabled until
 * the other field has something in it; the result replaces this field's text.
 */
export function TranslateButton({ from, to, kind = 'text', onDone, label }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const empty = !String(from || '').trim()
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      onDone(await aiTranslate(from, to, kind))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={go}
        disabled={busy || empty}
        title={empty ? `Type the ${to === 'te' ? 'English' : 'Telugu'} first` : undefined}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaWandMagicSparkles className="text-brand-700" aria-hidden="true" />
        {busy ? 'Translating…' : label || (to === 'te' ? 'Fill in Telugu from the English' : 'Fill in English from the Telugu')}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  )
}

/** A "Gemini" action button with its own busy state and error line. */
export function AiAction({ onRun, children, busyText = 'Reading…', disabled = false, hint }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [note, setNote] = useState(null)
  const go = async () => {
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      const msg = await onRun()
      if (typeof msg === 'string') setNote(msg)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy || disabled}
        className="inline-flex items-center gap-2 rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-500 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" aria-hidden="true" />
        ) : (
          <FaWandMagicSparkles className="text-brand-700" aria-hidden="true" />
        )}
        {busy ? busyText : children}
      </button>
      {hint && !error && !note && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {note && <p className="mt-1.5 text-xs text-leaf-700">{note}</p>}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  )
}
