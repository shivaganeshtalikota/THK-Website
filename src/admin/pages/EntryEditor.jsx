import { useEffect, useRef, useState } from 'react'
import { FaPlus, FaPen, FaTrash, FaImage, FaWandMagicSparkles, FaXmark } from 'react-icons/fa6'
import { api, uploadBlob } from '../api'
import { useContent } from '../content'
import { Button, Card, Empty, Field, LiveStatus, Notice, PageHeader, Progress, inputCls } from '../ui'
import { fmtBytes, fmtDate } from '../format'
import { MAX_PHOTO_BYTES, preparePhoto } from '../imageTools'

/**
 * The gallery and the news page share one editor: a title, some text, a
 * category and source links — and, for the gallery, a photograph.
 *
 * Photographs go up at full quality. A display copy (2000px) is made for the
 * gallery grid so the page stays fast on phones, and the original travels
 * alongside it for the full-screen viewer. Both upload in parts through the
 * console's own storage, so there is no 4MB ceiling any more.
 */

const CATEGORIES = [
  { id: 'party', label: 'Party & Leadership' },
  { id: 'constituency', label: 'Constituency' },
  { id: 'temple', label: 'Temple & Devotion' },
  { id: 'culture', label: 'Telugu Culture' },
  { id: 'press', label: 'Press Coverage' },
]

const BLANK = { title: '', description: '', category: 'party', sources: [] }

function SourcesEditor({ sources, onChange }) {
  const set = (i, k, v) => onChange(sources.map((s, j) => (j === i ? { ...s, [k]: v } : s)))
  return (
    <div className="space-y-2">
      {sources.map((s, i) => (
        <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input className={`${inputCls} !mt-0 sm:w-44`} placeholder="Name, e.g. Eenadu" value={s.label} onChange={(e) => set(i, 'label', e.target.value)} />
          <input className={`${inputCls} !mt-0 flex-1`} placeholder="https://…" value={s.url} onChange={(e) => set(i, 'url', e.target.value)} />
          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-ink-200 text-ink-500 hover:text-red-600" onClick={() => onChange(sources.filter((_, j) => j !== i))} aria-label="Remove source">
            <FaXmark aria-hidden="true" />
          </button>
        </div>
      ))}
      {sources.length < 8 && (
        <button type="button" onClick={() => onChange([...sources, { label: '', url: '' }])} className="text-sm font-semibold text-ink-700 underline-offset-2 hover:underline">
          + Add a source link
        </button>
      )}
    </div>
  )
}

const EntryEditor = ({ kind }) => {
  const isPhoto = kind === 'photo'
  const { content, reload } = useContent()
  const [form, setForm] = useState(BLANK)
  const [editingId, setEditingId] = useState(null)
  const [photo, setPhoto] = useState(null) // {display, original, width, height, preview}
  const [busy, setBusy] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [aiText, setAiText] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const fileRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => () => photo?.preview && URL.revokeObjectURL(photo.preview), [photo])

  const list = (isPhoto ? content?.uploads?.photos : content?.uploads?.updates) || []

  const pick = async (file) => {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_PHOTO_BYTES) return setError('That photo is over 30 MB.')
    setBusy('Preparing the photo…')
    try {
      const p = await preparePhoto(file)
      setPhoto({ ...p, preview: URL.createObjectURL(p.display), name: file.name, size: file.size })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const startEdit = (e) => {
    setEditingId(e.id)
    setForm({ title: e.title || '', description: e.description || e.summary || '', category: e.category || 'party', sources: e.sources || [] })
    setPhoto(null)
    setDone(null)
    setError(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const reset = () => {
    setEditingId(null)
    setForm(BLANK)
    setPhoto(null)
    setAiText('')
    setAiOpen(false)
  }

  const draft = async () => {
    setBusy('Drafting a caption…')
    setError(null)
    try {
      const { summary } = await api('summarize', { text: aiText, title: form.title })
      setForm((f) => ({ ...f, description: summary }))
      setAiOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    setError(null)
    setDone(null)
    if (form.title.trim().length < 3) return setError('Give it a title of at least 3 characters.')
    if (isPhoto && !editingId && !photo) return setError('Choose a photo to upload.')
    try {
      let image
      let original
      if (photo) {
        const total = photo.display.size + (photo.original?.size || 0)
        setBusy('Uploading the photo…')
        setProgress(0)
        image = await uploadBlob(photo.display, (f) => setProgress((f * photo.display.size) / total))
        if (photo.original) {
          original = await uploadBlob(photo.original, (f) => setProgress((photo.display.size + f * photo.original.size) / total))
        }
      }
      setBusy('Publishing…')
      setProgress(null)
      const d = await api(isPhoto ? 'photo-save' : 'update-save', {
        id: editingId || undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        sources: form.sources.filter((s) => s.url.trim()),
        ...(image ? { image } : {}),
        ...(original ? { original } : {}),
      })
      setDone({ commit: d.commit, message: editingId ? 'Changes saved.' : 'Published.' })
      reset()
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  const remove = async (e) => {
    if (!window.confirm(`Remove “${e.title}” from the website?`)) return
    setBusy('Removing…')
    setError(null)
    try {
      const d = await api(isPhoto ? 'photo-delete' : 'update-delete', { id: e.id })
      setDone({ commit: d.commit, message: 'Removed.' })
      if (editingId === e.id) reset()
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title={isPhoto ? 'Photo gallery' : 'News & updates'}
        subtitle={
          isPhoto
            ? 'Photos appear first in the gallery on the Media page, under the category you choose. Upload at full quality — nothing is squeezed to 4 MB any more.'
            : 'Short written updates for the Media page: what happened, where it was reported.'
        }
      />

      <div ref={formRef} className="scroll-mt-6">
        <Card title={editingId ? 'Edit' : isPhoto ? 'Add a photo' : 'Add an update'} actions={editingId && <Button variant="ghost" onClick={reset}>Cancel editing</Button>}>
          <div className="grid gap-5 md:grid-cols-5">
            {isPhoto && (
              <div className="md:col-span-2">
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg border border-dashed border-ink-300 bg-ink-50 text-center hover:border-ink-500"
                >
                  {photo ? (
                    <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-4">
                      <FaImage className="mx-auto text-2xl text-ink-400" aria-hidden="true" />
                      <span className="mt-2 block text-sm font-semibold text-ink-800">{editingId ? 'Replace the photo (optional)' : 'Choose a photo'}</span>
                      <span className="mt-1 block text-xs text-ink-500">JPG, PNG or WebP · up to 30 MB</span>
                    </span>
                  )}
                </button>
                {photo && (
                  <p className="mt-2 text-xs text-ink-500">
                    {photo.width}×{photo.height}px · {fmtBytes(photo.size)} — original kept at full quality
                  </p>
                )}
              </div>
            )}
            <div className={`space-y-4 ${isPhoto ? 'md:col-span-3' : 'md:col-span-5'}`}>
              <Field label="Title *">
                <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={200} />
              </Field>
              <Field label={isPhoto ? 'Caption' : 'Summary'} hint="Telugu or English.">
                <textarea className={`${inputCls} min-h-[6rem]`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={4000} />
              </Field>
              <div>
                <button type="button" onClick={() => setAiOpen((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:underline">
                  <FaWandMagicSparkles className="text-brand-700" aria-hidden="true" /> Draft it from a news article
                </button>
                {aiOpen && (
                  <div className="mt-2 space-y-2">
                    <textarea className={`${inputCls} min-h-[6rem]`} placeholder="Paste the article text here…" value={aiText} onChange={(e) => setAiText(e.target.value)} />
                    <Button variant="ghost" onClick={draft} busy={busy === 'Drafting a caption…'} disabled={aiText.trim().length < 40}>
                      Draft caption
                    </Button>
                    <p className="text-xs text-ink-500">The draft goes into the box above. Read it before publishing — it states only what the article says.</p>
                  </div>
                )}
              </div>
              {isPhoto && (
                <Field label="Category">
                  <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Sources" hint="Where this was reported. Shown as links under the item.">
                <SourcesEditor sources={form.sources} onChange={(sources) => setForm((f) => ({ ...f, sources }))} />
              </Field>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {error && <Notice tone="error">{error}</Notice>}
            {busy && progress !== null && <Progress value={progress} label={busy} />}
            {busy && progress === null && busy !== 'Drafting a caption…' && (
              <p className="flex items-center gap-2 text-sm text-ink-600">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" aria-hidden="true" />
                {busy}
              </p>
            )}
            {done && <LiveStatus commit={done.commit} message={done.message} />}
            <Button variant="brand" onClick={save} busy={Boolean(busy) && busy !== 'Drafting a caption…'}>
              <FaPlus aria-hidden="true" /> {editingId ? 'Save changes' : 'Publish'}
            </Button>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-9 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500">Published ({list.length})</h2>
      {!content ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : list.length === 0 ? (
        <Empty icon={isPhoto ? FaImage : FaPen} title="Nothing published from the console yet" />
      ) : (
        <ul className={isPhoto ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {list.map((e) => (
            <li key={e.id} className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-sm">
              {isPhoto && (
                <div className="aspect-[4/3] bg-ink-100">
                  <img
                    src={e.src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(ev) => {
                      ev.currentTarget.style.visibility = 'hidden'
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-ink-900">{e.title}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {fmtDate(e.updatedAt || e.publishedAt)}
                  {e.category ? ` · ${CATEGORIES.find((c) => c.id === e.category)?.label || e.category}` : ''}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => startEdit(e)}>
                    <FaPen aria-hidden="true" /> Edit
                  </Button>
                  <Button variant="danger" className="!px-3 !py-1.5 !text-xs" onClick={() => remove(e)}>
                    <FaTrash aria-hidden="true" /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default EntryEditor
