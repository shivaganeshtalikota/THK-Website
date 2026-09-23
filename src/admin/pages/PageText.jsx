import { useMemo, useState } from 'react'
import { FaMagnifyingGlass, FaRotateLeft } from 'react-icons/fa6'
import { te } from '../../i18n/te'
import { Button, Card, LiveStatus, Notice, PageHeader, inputCls } from '../ui'
import { useSection } from '../useSection'

const NO_TEXT = {}
const KEYS = Object.keys(te)

/**
 * Change any sentence on the website, in English, Telugu, or both.
 *
 * Every piece of text the site shows in both languages is listed here — the
 * same list the Telugu translation is built from. Search for the words you
 * want to change, edit them, save. An edit replaces that text everywhere it
 * appears; clearing an edit puts the original back.
 */
const PageText = () => {
  const { draft, setDraft, save, saving, error, done, dirty, ready } = useSection('text', NO_TEXT)
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(25)
  const [onlyEdited, setOnlyEdited] = useState(false)
  const edits = useMemo(() => draft || {}, [draft])

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return KEYS.filter((k) => {
      if (onlyEdited && !edits[k]) return false
      if (!needle) return true
      return k.toLowerCase().includes(needle) || String(te[k]).toLowerCase().includes(needle) || JSON.stringify(edits[k] || '').toLowerCase().includes(needle)
    })
  }, [q, onlyEdited, edits])

  const setEdit = (k, lang, v) =>
    setDraft((d) => {
      const next = { ...(d || {}) }
      const cur = { ...(next[k] || {}), [lang]: v }
      if (!cur.en) delete cur.en
      if (!cur.te) delete cur.te
      if (Object.keys(cur).length) next[k] = cur
      else delete next[k]
      return next
    })

  const editedCount = Object.keys(edits).length

  return (
    <>
      <PageHeader
        title="Page text"
        subtitle="Any sentence on the website, in English and Telugu. Search for the words you want to change. An empty box means the original text is used."
      />
      {!ready ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : (
        <>
          <div className="sticky top-16 z-10 -mx-1 mb-4 rounded-xl border border-ink-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:top-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[14rem] flex-1">
                <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                <input
                  className={`${inputCls} !mt-0 pl-9`}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setLimit(25)
                  }}
                  placeholder="Search, e.g. “temple” or “ఆలయం”"
                  aria-label="Search the website's text"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={onlyEdited} onChange={(e) => setOnlyEdited(e.target.checked)} /> Only changed ({editedCount})
              </label>
              <Button variant="brand" onClick={() => save()} busy={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
            {(error || done) && (
              <div className="mt-3">
                {error && <Notice tone="error">{error}</Notice>}
                {done && <LiveStatus commit={done.commit} message="Text saved." />}
              </div>
            )}
          </div>

          <p className="mb-3 text-sm text-ink-500">
            {matches.length} of {KEYS.length} texts
          </p>

          <ul className="space-y-3">
            {matches.slice(0, limit).map((k) => {
              const e = edits[k] || {}
              return (
                <li key={k}>
                  <Card>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-400">English</p>
                        <p className="mt-1 text-sm text-ink-600">{k}</p>
                        <textarea
                          className={`${inputCls} min-h-[3.2rem] text-sm`}
                          value={e.en || ''}
                          onChange={(ev) => setEdit(k, 'en', ev.target.value)}
                          placeholder="Keep the original"
                          rows={Math.min(6, Math.ceil(k.length / 70) + 1)}
                        />
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-400">Telugu</p>
                        <p lang="te" className="mt-1 text-sm text-ink-600">
                          {te[k]}
                        </p>
                        <textarea
                          lang="te"
                          className={`${inputCls} min-h-[3.2rem] text-sm`}
                          value={e.te || ''}
                          onChange={(ev) => setEdit(k, 'te', ev.target.value)}
                          placeholder="Keep the original"
                          rows={Math.min(6, Math.ceil(String(te[k]).length / 60) + 1)}
                        />
                      </div>
                    </div>
                    {(e.en || e.te) && (
                      <button type="button" onClick={() => { setEdit(k, 'en', ''); setEdit(k, 'te', '') }} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
                        <FaRotateLeft aria-hidden="true" /> Use the original again
                      </button>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
          {matches.length > limit && (
            <div className="mt-5 text-center">
              <Button variant="ghost" onClick={() => setLimit((l) => l + 50)}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default PageText
