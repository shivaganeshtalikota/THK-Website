import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaCloudArrowUp,
  FaStar,
  FaRegStar,
  FaTrash,
  FaArrowLeftLong,
  FaArrowRightLong,
  FaRotateRight,
  FaTriangleExclamation,
  FaCircleCheck,
} from 'react-icons/fa6'
import { api, itdpThumbSrc, uploadItdpPhoto } from '../api'
import { ITDP_SITE } from '../content'
import { prepareProgramPhoto } from '../imageTools'
import { Button, Card, Field, LiveStatus, Notice, PageHeader, inputCls } from '../ui'

const BLANK = {
  title: '',
  titleTe: '',
  date: new Date().toISOString().slice(0, 10),
  datePrecision: 'day',
  time: '',
  venue: '',
  description: '',
  descriptionTe: '',
}

/** Photos prepared and uploaded at the same time. */
const PARALLEL = 3

/** ASCII web address from an English title; empty if there is not enough Latin. */
const slugify = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/, '')

const photoId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** YouTube and Vimeo links, one per line -> [{provider, id}], plus the lines that are neither. */
function parseVideos(text) {
  const videos = []
  const bad = []
  for (const line of String(text).split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
    const yt = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(line)
    const vm = /vimeo\.com\/(?:video\/)?(\d{4,12})/.exec(line)
    if (yt) videos.push({ provider: 'youtube', id: yt[1] })
    else if (vm) videos.push({ provider: 'vimeo', id: vm[1] })
    else bad.push(line)
  }
  return { videos, bad }
}

const videoUrl = (v) => (v.provider === 'vimeo' ? `https://vimeo.com/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`)

/**
 * Add or edit one iTDP programme and its photo album.
 *
 * Photos upload the moment they are chosen — prepared in the browser (sized,
 * stripped of location data), then sent one by one to the iTDP photo storage —
 * so a long album does not have to survive one enormous request. Nothing is
 * on the website until Save, which publishes the programme with every photo
 * that finished uploading.
 */
const ItdpProgramEditor = () => {
  const { slug: editSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const editing = Boolean(editSlug)

  const [loaded, setLoaded] = useState(!editing)
  const [existing, setExisting] = useState(null)
  const [allSlugs, setAllSlugs] = useState([])
  const [site, setSite] = useState(ITDP_SITE)
  const [form, setForm] = useState(BLANK)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [coverKey, setCoverKey] = useState(null)
  const [videosText, setVideosText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(location.state?.done || null)
  const [dragging, setDragging] = useState(false)

  /*
   * The album: every photo, uploaded or on its way, in display order.
   *   { key, state: 'ready'|'queued'|'preparing'|'uploading'|'failed',
   *     photo?: {k,w,h,b}, preview?: objectURL, file?, id, name, progress, error }
   * Kept in a ref as well as state so the upload workers always see the
   * latest list, not the one from the render that started them.
   */
  const [items, setItemsState] = useState([])
  const itemsRef = useRef([])
  const setItems = useCallback((fn) => {
    itemsRef.current = typeof fn === 'function' ? fn(itemsRef.current) : fn
    setItemsState(itemsRef.current)
  }, [])
  const update = useCallback((key, patch) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it))), [setItems])

  const slugRef = useRef('')
  const running = useRef(0)
  const fileInput = useRef(null)

  /* ------------------------------------------------------------- loading */

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const content = await api('itdp-content')
        if (!alive) return
        setAllSlugs(content.programs.map((p) => p.slug))
        setSite(content.site || ITDP_SITE)
        if (!editing) return
        const p = content.programs.find((x) => x.slug === editSlug)
        if (!p) {
          setError('That programme no longer exists.')
          setLoaded(true)
          return
        }
        const album = await api('itdp-album', undefined, { query: { slug: editSlug } })
        if (!alive) return
        setExisting(p)
        setSlug(p.slug)
        slugRef.current = p.slug
        setForm({
          title: p.title || '',
          titleTe: p.titleTe || '',
          date: p.date,
          datePrecision: p.datePrecision || 'day',
          time: p.time || '',
          venue: p.venue || '',
          description: p.description || '',
          descriptionTe: p.descriptionTe || '',
        })
        setCoverKey(p.cover?.k || null)
        setVideosText((p.videos || []).map(videoUrl).join('\n'))
        setItems(album.photos.map((photo) => ({ key: photo.k, id: photo.k, state: 'ready', photo })))
        // The cover of an imported programme is a separate file, not one of
        // the album's photos; keep it available to choose.
        if (p.cover && !album.photos.some((x) => x.k === p.cover.k)) {
          setItems((list) => [{ key: p.cover.k, id: p.cover.k, state: 'ready', photo: p.cover, coverOnly: true }, ...list])
        }
        setLoaded(true)
      } catch (err) {
        if (alive) {
          setError(err.message)
          setLoaded(true)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [editing, editSlug, setItems])

  // Revoke local previews when leaving.
  useEffect(() => () => itemsRef.current.forEach((it) => it.preview && URL.revokeObjectURL(it.preview)), [])

  /* ---------------------------------------------------------- web address */

  const busyUploads = items.some((it) => ['queued', 'preparing', 'uploading'].includes(it.state))
  const slugLocked = editing || items.length > 0

  useEffect(() => {
    if (slugLocked || slugTouched) return
    const s = slugify(form.title) || `programme-${form.date}`
    setSlug(s)
  }, [form.title, form.date, slugLocked, slugTouched])

  useEffect(() => {
    slugRef.current = slug
  }, [slug])

  const slugTaken = !editing && allSlugs.includes(slug)
  const slugValid = /^[a-z0-9][a-z0-9-]{1,79}$/.test(slug)

  // Leaving mid-upload loses the photos still on their way.
  useEffect(() => {
    if (!busyUploads) return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busyUploads])

  /* -------------------------------------------------------------- uploads */

  const pump = useCallback(() => {
    while (running.current < PARALLEL) {
      const next = itemsRef.current.find((it) => it.state === 'queued')
      if (!next) break
      running.current += 1
      update(next.key, { state: 'preparing', error: null })
      ;(async () => {
        try {
          const { display, thumb } = await prepareProgramPhoto(next.file)
          update(next.key, { state: 'uploading', progress: 0, preview: URL.createObjectURL(thumb) })
          const photo = await uploadItdpPhoto({
            slug: slugRef.current,
            id: next.id,
            thumb,
            display,
            onProgress: (p) => update(next.key, { progress: p }),
          })
          update(next.key, { state: 'ready', photo, file: null })
        } catch (err) {
          update(next.key, { state: 'failed', error: err.message })
        } finally {
          running.current -= 1
          pump()
        }
      })()
    }
  }, [update])

  const addFiles = (fileList) => {
    setError(null)
    const files = [...(fileList || [])].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))
    if (!files.length) return
    if (!slugValid || slugTaken) {
      setError('Give the programme a title (and a free web address) before adding photos — the photos are stored under it.')
      return
    }
    // Keep the order they were chosen in: by file name, which for camera and
    // WhatsApp photos is the order they were taken.
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    setItems((list) => [...list, ...files.map((file) => ({ key: photoId(), id: photoId(), state: 'queued', file, name: file.name, progress: 0 }))])
    pump()
  }

  const retry = (it) => {
    update(it.key, { state: 'queued', error: null })
    pump()
  }

  const move = (idx, d) =>
    setItems((list) => {
      const j = idx + d
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  const remove = (it) => {
    if (it.preview) URL.revokeObjectURL(it.preview)
    setItems((list) => list.filter((x) => x.key !== it.key))
    if (coverKey && it.photo?.k === coverKey) setCoverKey(null)
  }

  /* ---------------------------------------------------------------- save */

  const { videos, bad: badVideos } = parseVideos(videosText)
  const ready = items.filter((it) => it.state === 'ready' && !it.coverOnly).map((it) => it.photo)
  const coverItem = items.find((it) => it.photo?.k === coverKey)
  const cover = coverItem?.photo || ready[0] || null
  const failed = items.filter((it) => it.state === 'failed').length
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setError(null)
    setDone(null)
    if (form.title.trim().length < 3) return setError('Give the programme a title.')
    if (!form.date) return setError('Choose the date of the programme.')
    if (!slugValid) return setError('The web address must be lowercase letters, numbers and hyphens.')
    if (slugTaken) return setError('Another programme already uses that web address. Change it.')
    if (busyUploads) return setError('Wait for the photos to finish uploading.')
    if (badVideos.length) return setError(`Not a YouTube or Vimeo link: ${badVideos[0]}`)
    setSaving(true)
    try {
      const d = await api('itdp-program-save', {
        editing: editing ? editSlug : undefined,
        slug,
        ...form,
        dateConfirmed: true,
        cover,
        photos: ready,
        videos,
      })
      const result = { commit: d.commit, url: d.url, message: editing ? 'Programme saved.' : 'Programme published.' }
      setDone(result)
      setExisting((e) => (e ? { ...e, dateConfirmed: true } : e))
      // From here on it is an edit. React Router may keep this component
      // mounted across the change of route, or remount it — the status
      // survives either way (state here, location.state there).
      if (!editing) navigate(`/itdp/programs/${slug}`, { replace: true, state: { done: result } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-sm text-ink-400">Loading…</p>
  if (editing && !existing) {
    return (
      <>
        <Notice tone="error">{error || 'That programme no longer exists.'}</Notice>
        <Link to="/itdp/programs" className="mt-4 inline-block text-sm font-semibold underline">
          Back to programmes
        </Link>
      </>
    )
  }

  return (
    <>
      <Link to="/itdp/programs" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
        <FaArrowLeft aria-hidden="true" /> All programmes
      </Link>
      <PageHeader
        title={editing ? form.title || 'Edit programme' : 'Add a programme'}
        subtitle="Published on itdptelangana.com/programs, where the newest programmes appear first."
      />

      <div className="space-y-6">
        {existing?.dateConfirmed === false && (
          <Notice tone="warn">
            This programme came from the old website, which never recorded its date. The date below is an estimate — the site shows only
            the {existing.datePrecision === 'year' ? 'year' : 'month'}. Set the real date and save to confirm it.
          </Notice>
        )}

        <Card title="Details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title (English) *">
              <input className={inputCls} value={form.title} onChange={set('title')} maxLength={140} placeholder="e.g. Bike Rally – Medchal" />
            </Field>
            <Field label="Title (Telugu)">
              <input lang="te" className={inputCls} value={form.titleTe} onChange={set('titleTe')} maxLength={140} />
            </Field>
            <Field label="Date *" hint="Programmes are sorted by this date, newest first. A date today or later shows the programme as Upcoming on the site — on the homepage, with “Add to calendar” and a WhatsApp invite.">
              <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
            </Field>
            <Field label="Start time" hint="Optional. Shown on an upcoming programme and used for “Add to calendar”. Leave blank if not fixed.">
              <input type="time" className={inputCls} value={form.time} onChange={set('time')} disabled={form.datePrecision !== 'day'} />
            </Field>
            <Field label="Show the date as" hint="Choose “month” or “year” only when the exact day is not known.">
              <select className={inputCls} value={form.datePrecision} onChange={set('datePrecision')}>
                <option value="day">The exact day</option>
                <option value="month">Month and year only</option>
                <option value="year">Year only</option>
              </select>
            </Field>
            <Field label="Venue">
              <input className={inputCls} value={form.venue} onChange={set('venue')} maxLength={140} placeholder="e.g. NTR Trust Bhavan, Hyderabad" />
            </Field>
            <Field
              label="Web address"
              hint={
                slugLocked
                  ? `${site}/programs/${slug} — fixed once photos are added, so links keep working.`
                  : slugTaken
                    ? 'Another programme already uses this address — change it.'
                    : `${site}/programs/${slug || '…'}`
              }
            >
              <input
                className={inputCls}
                value={slug}
                disabled={slugLocked}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
              />
            </Field>
            <Field label="Description (English)" className="md:col-span-1">
              <textarea className={`${inputCls} min-h-[7rem]`} value={form.description} onChange={set('description')} maxLength={4000} />
            </Field>
            <Field label="Description (Telugu)">
              <textarea lang="te" className={`${inputCls} min-h-[7rem]`} value={form.descriptionTe} onChange={set('descriptionTe')} maxLength={4000} />
            </Field>
            <Field label="Videos" className="md:col-span-2" hint="YouTube or Vimeo links, one per line.">
              <textarea className={`${inputCls} min-h-[4.5rem] font-mono text-xs`} value={videosText} onChange={(e) => setVideosText(e.target.value)} />
            </Field>
          </div>
          {badVideos.length > 0 && (
            <p className="mt-2 text-sm text-red-700">
              Not a YouTube or Vimeo link: <code>{badVideos[0]}</code>
            </p>
          )}
        </Card>

        <Card
          title={`Photos (${ready.length})`}
          subtitle="The first photo — or the one you star — is the cover. Photos are resized and uploaded as soon as you add them."
          actions={
            <Button variant="brand" onClick={() => fileInput.current?.click()}>
              <FaCloudArrowUp aria-hidden="true" /> Add photos
            </Button>
          }
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`rounded-xl border-2 border-dashed p-4 transition ${dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}
          >
            {items.length === 0 ? (
              <button type="button" onClick={() => fileInput.current?.click()} className="grid w-full place-items-center gap-2 py-10 text-sm text-ink-500">
                <FaCloudArrowUp className="text-3xl text-ink-300" aria-hidden="true" />
                Drop photos here, or tap to choose them — as many as you like.
              </button>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {items.map((it, idx) => {
                  const isCover = it.photo && (coverKey ? it.photo.k === coverKey : cover?.k === it.photo.k)
                  const src = it.preview || (it.photo ? itdpThumbSrc(it.photo.k) : null)
                  return (
                    <li key={it.key} className={`group relative overflow-hidden rounded-lg border bg-ink-50 ${isCover ? 'border-brand-500 ring-2 ring-brand-500' : 'border-ink-200'}`}>
                      <div className="aspect-square">
                        {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-ink-100" />}
                      </div>
                      {it.state !== 'ready' && (
                        <div className="absolute inset-0 grid place-items-center bg-ink-950/55 p-2 text-center text-[0.7rem] font-semibold text-white">
                          {it.state === 'failed' ? (
                            <span>
                              <FaTriangleExclamation className="mx-auto mb-1 text-amber-300" aria-hidden="true" />
                              {it.error}
                              <button type="button" onClick={() => retry(it)} className="mt-1.5 inline-flex items-center gap-1 rounded bg-white/15 px-2 py-1">
                                <FaRotateRight aria-hidden="true" /> Retry
                              </button>
                            </span>
                          ) : (
                            <span className="w-full">
                              {it.state === 'queued' ? 'Waiting…' : it.state === 'preparing' ? 'Preparing…' : `Uploading ${Math.round((it.progress || 0) * 100)}%`}
                              <span className="mt-1.5 block h-1 overflow-hidden rounded bg-white/20">
                                <span className="block h-full bg-brand-400" style={{ width: `${Math.round((it.progress || 0) * 100)}%` }} />
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                      {it.coverOnly && <span className="absolute left-1.5 top-1.5 rounded bg-ink-900/80 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">Cover only</span>}
                      <button
                        type="button"
                        onClick={() => remove(it)}
                        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs text-ink-700 shadow hover:bg-red-600 hover:text-white"
                        aria-label="Remove photo"
                        title="Remove photo"
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                      <div className="flex items-center justify-between gap-1 border-t border-ink-200 bg-white px-1.5 py-1">
                        <button
                          type="button"
                          disabled={it.state !== 'ready'}
                          onClick={() => setCoverKey(it.photo.k)}
                          className={`grid h-7 w-7 place-items-center rounded ${isCover ? 'text-brand-600' : 'text-ink-400 hover:text-ink-900'}`}
                          aria-label="Use as cover"
                          title="Use as cover"
                        >
                          {isCover ? <FaStar aria-hidden="true" /> : <FaRegStar aria-hidden="true" />}
                        </button>
                        <span className="flex">
                          <button type="button" onClick={() => move(idx, -1)} className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-900" aria-label="Move earlier" title="Move earlier">
                            <FaArrowLeftLong aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => move(idx, 1)} className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-900" aria-label="Move later" title="Move later">
                            <FaArrowRightLong aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {busyUploads && <p className="mt-3 text-sm text-ink-600">Uploading… keep this page open until every photo is done.</p>}
          {failed > 0 && !busyUploads && (
            <p className="mt-3 text-sm text-amber-800">
              {failed} photo{failed > 1 ? 's' : ''} did not upload. Retry {failed > 1 ? 'them' : 'it'}, or remove {failed > 1 ? 'them' : 'it'} — saving publishes only the photos that uploaded.
            </p>
          )}
        </Card>

        <div className="sticky bottom-0 -mx-4 space-y-3 border-t border-ink-200 bg-ink-50/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          {error && <Notice tone="error">{error}</Notice>}
          {done && <LiveStatus site="itdp" commit={done.commit} message={done.message} link={done.url} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="brand" onClick={save} busy={saving} disabled={busyUploads}>
              <FaCircleCheck aria-hidden="true" /> {editing ? 'Save changes' : 'Publish programme'}
            </Button>
            <Link to="/itdp/programs" className="text-sm font-semibold text-ink-600 hover:text-ink-900">
              Cancel
            </Link>
            <span className="text-xs text-ink-500">
              {ready.length} photo{ready.length === 1 ? '' : 's'} · {videos.length} video{videos.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ItdpProgramEditor
