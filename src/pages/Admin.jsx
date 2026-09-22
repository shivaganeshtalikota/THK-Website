import { useCallback, useEffect, useState } from 'react'
import { FaPlus, FaXmark, FaPen, FaTrash, FaWandMagicSparkles } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PosterPublisher from '../components/PosterPublisher'

/**
 * Publishing panel.
 *
 * Posts to /api/publish, which commits to the repository; Vercel redeploys and
 * the site picks it up. No credential is stored — the id and password travel
 * with each request and are verified server-side, where the GitHub token lives.
 *
 * Deliberately noindex, kept out of the sitemap and disallowed in robots.txt:
 * this is an operational page, not content.
 */
const CATEGORIES = [
  { id: 'party', label: 'Party & Leadership' },
  { id: 'constituency', label: 'Constituency' },
  { id: 'temple', label: 'Temple & Devotion' },
  { id: 'culture', label: 'Telugu Culture' },
  { id: 'press', label: 'Press Coverage' },
]

const MAX_MB = 4
const BLANK = { kind: 'photo', title: '', description: '', category: 'party', sources: [] }

const field =
  'mt-2 w-full border border-ink-300 bg-white px-4 py-3 text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-ink-900'
const labelCls = 'block font-sans text-micro uppercase tracking-[0.14em] text-ink-600'

const Admin = () => {
  const [auth, setAuth] = useState({ adminId: '', password: '', ok: false })
  const [form, setForm] = useState(BLANK)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [published, setPublished] = useState({ photos: [], updates: [] })
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [useAi, setUseAi] = useState(false)
  const [sourceText, setSourceText] = useState('')

  const call = useCallback(
    async (payload, endpoint = '/api/publish') => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: auth.adminId, password: auth.password, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Failed (${res.status}).`)
      return data
    },
    [auth.adminId, auth.password]
  )

  const refresh = useCallback(async () => {
    const data = await call({ action: 'list' })
    setPublished({ photos: data.photos ?? [], updates: data.updates ?? [] })
  }, [call])

  const signIn = async (e) => {
    e.preventDefault()
    setStatus(null)
    setBusy(true)
    try {
      await refresh()
      setAuth((a) => ({ ...a, ok: true }))
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview)
  }, [preview])

  const pickFile = (e) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    setStatus(
      f && f.size > MAX_MB * 1024 * 1024
        ? { type: 'error', text: `That image is ${(f.size / 1024 / 1024).toFixed(1)}MB — the limit is ${MAX_MB}MB.` }
        : null
    )
  }

  const readBase64 = (f) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result).split(',')[1])
      r.onerror = () => reject(new Error('Could not read that file.'))
      r.readAsDataURL(f)
    })

  const setSource = (i, key, value) =>
    setForm((f) => {
      const sources = [...f.sources]
      sources[i] = { ...sources[i], [key]: value }
      return { ...f, sources }
    })

  const summarise = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const { summary } = await call(
        { text: sourceText, title: form.title },
        '/api/summarize'
      )
      setForm((f) => ({ ...f, description: summary }))
      setStatus({ type: 'ok', text: 'Draft caption written below — read it before publishing.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (entry, kind) => {
    setEditingId(entry.id)
    setForm({
      kind,
      title: entry.title ?? '',
      description: entry.description ?? entry.summary ?? '',
      category: entry.category ?? 'party',
      sources: entry.sources ?? [],
    })
    setFile(null)
    setPreview(null)
    setStatus(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    setForm(BLANK)
    setEditingId(null)
    setFile(null)
    setPreview(null)
    setSourceText('')
  }

  const remove = async (entry, kind) => {
    if (!window.confirm(`Remove “${entry.title}”? This cannot be undone from here.`)) return
    setBusy(true)
    try {
      await call({ action: 'delete', kind, id: entry.id })
      await refresh()
      setStatus({ type: 'ok', text: 'Removed. The site rebuilds in a minute or two.' })
      if (editingId === entry.id) reset()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (form.title.trim().length < 3)
      return setStatus({ type: 'error', text: 'Give it a title of at least 3 characters.' })
    if (form.kind === 'photo' && !editingId && !file)
      return setStatus({ type: 'error', text: 'Choose an image to upload.' })

    setBusy(true)
    try {
      const payload = {
        action: editingId ? 'update' : 'create',
        id: editingId ?? undefined,
        kind: form.kind,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        sources: form.sources.filter((s) => s.url?.trim()),
      }
      if (form.kind === 'photo' && file) payload.image = await readBase64(file)

      const data = await call(payload)
      await refresh()
      setStatus({ type: 'ok', text: `${data.message ?? 'Saved.'} Commit ${data.commit}.` })
      reset()
      e.target.reset?.()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  // ---------------------------------------------------------------- sign in
  if (!auth.ok) {
    return (
      <>
        <Seo
          title="Publish"
          description="Operational publishing panel for the office. Not public content; excluded from the sitemap and marked noindex."
          noindex
        />
        <section className="section bg-ink-50">
          <div className="container-custom">
            <form onSubmit={signIn} className="mx-auto max-w-md">
              <p className="eyebrow">Office Use</p>
              <h1 className="mt-5 font-display text-title text-ink-900">Sign in</h1>
              <div className="mt-8 space-y-5">
                <div>
                  <label className={labelCls} htmlFor="aid">Admin ID</label>
                  <input
                    id="aid"
                    className={field}
                    autoComplete="username"
                    value={auth.adminId}
                    onChange={(e) => setAuth((a) => ({ ...a, adminId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pw">Password</label>
                  <input
                    id="pw"
                    type="password"
                    className={field}
                    autoComplete="current-password"
                    value={auth.password}
                    onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Checking…' : 'Sign in'}
                </button>
                {status && (
                  <p role="status" className="border-l-2 border-red-600 py-2 pl-4 text-sm text-red-800">
                    {status.text}
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </>
    )
  }

  const list = form.kind === 'photo' ? published.photos : published.updates

  // ------------------------------------------------------------------ panel
  return (
    <>
      <Seo
        title="Publish"
        description="Operational publishing panel for the office. Not public content; excluded from the sitemap and marked noindex."
        noindex
      />
      <section className="section bg-ink-50">
        <div className="container-custom">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow">Office Use</p>
            <h1 className="mt-5 font-display text-title text-ink-900">
              {editingId ? 'Edit entry' : 'Publish to the site'}
            </h1>
            <p className="mt-4 text-ink-600">
              Publishing commits to the repository and the site rebuilds on its own — give it a
              minute or two to appear.
            </p>

            <form onSubmit={submit} className="mt-10 space-y-7">
              <fieldset>
                <legend className={labelCls}>What is it?</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[
                    ['photo', 'A photograph'],
                    ['update', 'A written update'],
                    ['poster', 'A campaign poster'],
                  ].map(([value, text]) => (
                    <label
                      key={value}
                      className={`cursor-pointer border px-5 py-3 text-sm font-semibold transition-colors ${
                        form.kind === value
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-300 bg-white text-ink-700 hover:border-ink-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={value}
                        checked={form.kind === value}
                        onChange={() => setForm((f) => ({ ...f, kind: value }))}
                        className="sr-only"
                      />
                      {text}
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.kind === 'poster' ? null : (
              <>
              {/* 1 — Title */}
              <div>
                <label className={labelCls} htmlFor="title">1 · Title</label>
                <input
                  id="title"
                  className={field}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Bonalu celebrations at Golconda"
                />
              </div>

              {/* 2 — Description, optionally drafted from pasted source text */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className={labelCls} htmlFor="desc">2 · Description</label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-600">
                    <input
                      type="checkbox"
                      checked={useAi}
                      onChange={(e) => setUseAi(e.target.checked)}
                      className="h-4 w-4 accent-ink-900"
                    />
                    Draft it from an article
                  </label>
                </div>

                {useAi && (
                  <div className="mt-3 border border-ink-200 bg-white p-4">
                    <p className="text-xs leading-relaxed text-ink-600">
                      Paste the article text. It writes a neutral 25–45 word caption describing
                      only what the source says. <strong>Read it before publishing</strong> — it
                      goes into the box below, not straight onto the site.
                    </p>
                    <textarea
                      rows={5}
                      className={field}
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Paste the news article or press note here…"
                    />
                    <button
                      type="button"
                      onClick={summarise}
                      disabled={busy || sourceText.trim().length < 40}
                      className="btn-ghost mt-3 inline-flex items-center gap-2 text-sm disabled:opacity-40"
                    >
                      <FaWandMagicSparkles aria-hidden="true" />
                      {busy ? 'Writing…' : 'Draft the caption'}
                    </button>
                  </div>
                )}

                <textarea
                  id="desc"
                  rows={4}
                  className={field}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Shown as the caption, and read aloud by screen readers."
                />
              </div>

              {/* 3 — Sources */}
              <div>
                <label className={labelCls}>3 · Source links — optional</label>
                <div className="mt-3 space-y-3">
                  {form.sources.map((s, i) => (
                    <div key={i} className="flex flex-wrap gap-2">
                      <input
                        aria-label={`Source ${i + 1} name`}
                        className="min-w-[8rem] flex-[1] border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink-900"
                        placeholder="Outlet, e.g. Eenadu"
                        value={s.label ?? ''}
                        onChange={(e) => setSource(i, 'label', e.target.value)}
                      />
                      <input
                        aria-label={`Source ${i + 1} link`}
                        type="url"
                        className="min-w-[12rem] flex-[2] border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink-900"
                        placeholder="https://…"
                        value={s.url ?? ''}
                        onChange={(e) => setSource(i, 'url', e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={`Remove source ${i + 1}`}
                        onClick={() =>
                          setForm((f) => ({ ...f, sources: f.sources.filter((_, j) => j !== i) }))
                        }
                        className="grid h-11 w-11 shrink-0 place-items-center border border-ink-300 text-ink-600 transition-colors hover:border-ink-900 hover:text-ink-900"
                      >
                        <FaXmark aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, sources: [...f.sources, { label: '', url: '' }] }))
                  }
                  disabled={form.sources.length >= 8}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 underline underline-offset-4 disabled:opacity-40"
                >
                  <FaPlus aria-hidden="true" /> Add a source
                </button>
              </div>

              {/* 4 — Category */}
              <div>
                <label className={labelCls} htmlFor="cat">4 · Category</label>
                <select
                  id="cat"
                  className={field}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {form.kind === 'photo' && (
                <div>
                  <label className={labelCls} htmlFor="file">
                    5 · Image — JPEG, PNG or WebP, under {MAX_MB}MB
                    {editingId && ' — leave empty to keep the current one'}
                  </label>
                  <input
                    id="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pickFile}
                    className="mt-2 block w-full text-sm text-ink-700 file:mr-4 file:border-0 file:bg-ink-900 file:px-5 file:py-3 file:font-sans file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
                  />
                  {preview && (
                    <img src={preview} alt="" className="mt-4 max-h-64 w-auto border border-ink-200" />
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : editingId ? 'Save changes' : 'Publish'}
                </button>
                {editingId && (
                  <button type="button" onClick={reset} className="btn-ghost">
                    Cancel
                  </button>
                )}
              </div>

              {status && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`border-l-2 py-2 pl-4 text-sm ${
                    status.type === 'ok'
                      ? 'border-green-600 text-green-800'
                      : 'border-red-600 text-red-800'
                  }`}
                >
                  {status.text}
                </p>
              )}
              </>
              )}
            </form>

            {form.kind === 'poster' && <PosterPublisher call={call} />}

            {/* -------------------------------------------------- published */}
            <div className="mt-16 border-t hairline pt-10">
              <h2 className="font-display text-headline text-ink-900">
                Already published — {form.kind === 'photo' ? 'photographs' : 'updates'} ({list.length})
              </h2>
              {list.length === 0 ? (
                <p className="mt-4 text-sm text-ink-600">Nothing yet.</p>
              ) : (
                <ul className="mt-6 divide-y hairline border-y hairline">
                  {list.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-4 py-4">
                      {entry.src && (
                        <img
                          src={entry.src}
                          alt=""
                          className="h-14 w-14 shrink-0 object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{entry.title}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {entry.category ?? 'uncategorised'}
                          {entry.sources?.length ? ` · ${entry.sources.length} source${entry.sources.length > 1 ? 's' : ''}` : ''}
                          {entry.publishedAt ? ` · ${entry.publishedAt.slice(0, 10)}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(entry, form.kind)}
                        aria-label={`Edit ${entry.title}`}
                        className="grid h-10 w-10 place-items-center border border-ink-300 text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900"
                      >
                        <FaPen aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(entry, form.kind)}
                        aria-label={`Remove ${entry.title}`}
                        className="grid h-10 w-10 place-items-center border border-ink-300 text-red-700 transition-colors hover:border-red-700"
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Admin
