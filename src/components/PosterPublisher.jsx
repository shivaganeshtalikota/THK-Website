import { useCallback, useEffect, useRef, useState } from 'react'
import { FaUpload, FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6'
import { loadImage, ensureFonts, renderPoster, renderShareCard, canvasToJpeg } from '../lib/renderPoster'
import {
  POSTER_W,
  POSTER_H,
  TEMPLATE_VERSION,
  templateGeometry,
  slugify,
} from '../lib/posterTemplate'

/**
 * Turn an event image into a campaign anyone can put their name on.
 *
 * WHAT THIS REPLACES. Adding a poster used to mean a developer: measure the
 * artwork, write an entry in posters.js, preprocess the file, commit. That is
 * fine for one bespoke poster and hopeless for a campaign a week. The office
 * uploads the event image here and gets a working /posters/<slug> page, a social
 * card, a sitemap entry and both language routes, without anyone opening an
 * editor.
 *
 * WHY THE ARTWORK IS RECOMPOSED HERE RATHER THAN STORED AS UPLOADED
 * Posters are 4:5 and renderPoster fills the frame with the artwork. Handed a
 * 16:9 photograph it would stretch it, and a stretched face on party material is
 * exactly the sort of thing that gets screenshotted. So whatever is uploaded is
 * drawn cover-fit into a 2048x2560 canvas first, and THAT is what gets
 * published. The stored artwork is always the right shape by construction.
 *
 * WHY THE CARD IS MADE HERE TOO
 * The social card carries Telugu, and the browser is the only renderer in this
 * stack that shapes it correctly — the Python that builds the built-in cards
 * runs on a Pillow without raqm and reorders the conjuncts. Same reason the
 * supporter-facing cards are composed client-side.
 *
 * A separate component rather than a third branch inside Admin.jsx: that file is
 * five hundred lines of photo-and-update form logic, and a poster shares almost
 * none of it.
 */

const SAMPLE_NAME = 'తాళికోట హరి కృష్ణ'
const SAMPLE_DESIGNATION = 'ఐటీడీపీ తెలంగాణ రాష్ట్ర అధ్యక్షులు'

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

const field =
  'mt-2 w-full border border-ink-300 bg-white px-4 py-3 text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-ink-900'
const labelCls = 'block font-sans text-micro uppercase tracking-[0.14em] text-ink-600'

/** Draw an image cover-fit into a box, centred — no stretching, ever. */
function coverDraw(ctx, img, W, H) {
  const scale = Math.max(W / img.width, H / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
}

const PosterPublisher = ({ call, onPublished }) => {
  const [form, setForm] = useState({
    titleEn: '',
    title: '',
    summary: '',
    issue: '',
    date: '',
    slug: '',
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [artwork, setArtwork] = useState(null) // normalised HTMLImageElement
  const [logo, setLogo] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const previewRef = useRef(null)
  const fileRef = useRef(null)

  const geometry = templateGeometry()
  const slug = slugTouched ? form.slug : slugify(form.titleEn)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [mark] = await Promise.all([loadImage('/tdp-logo.png'), ensureFonts()])
        if (!alive) return
        setLogo(mark)
        setReady(true)
      } catch {
        if (alive) setError('The party mark or the fonts could not be loaded. Refresh and try again.')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  /** Normalise the upload to the poster's own shape, once, on selection. */
  const handleFile = useCallback(async (file) => {
    if (!file) return
    setError(null)
    setResult(null)
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('That image is very large. Please choose one under 12 MB.')
      return
    }

    const url = URL.createObjectURL(file)
    try {
      const raw = await loadImage(url)
      const canvas = document.createElement('canvas')
      canvas.width = POSTER_W
      canvas.height = POSTER_H
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      // A flat fill behind it, so an image that does not quite cover after
      // rounding never leaves a transparent sliver at an edge.
      ctx.fillStyle = '#0E0E0E'
      ctx.fillRect(0, 0, POSTER_W, POSTER_H)
      coverDraw(ctx, raw, POSTER_W, POSTER_H)

      const normalised = new Image()
      normalised.src = canvas.toDataURL('image/jpeg', 0.92)
      await normalised.decode()
      setArtwork(normalised)
    } catch {
      setError('That image could not be read.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }, [])

  /* The preview is the real renderer at a smaller scale, not a mock-up — what
   * is on screen is what a supporter will get, band, type and all. */
  useEffect(() => {
    if (!artwork || !ready || !previewRef.current) return
    const poster = { width: POSTER_W, height: POSTER_H, ...geometry }
    renderPoster({
      canvas: previewRef.current,
      poster,
      artwork,
      person: null,
      name: SAMPLE_NAME,
      designation: SAMPLE_DESIGNATION,
      logo,
      scale: 0.32,
    })

    // Where a supporter's photograph will land. Drawn only in the preview —
    // never in the published artwork — so the office can see that the slot
    // clears whatever is in the image before they commit to it.
    const ctx = previewRef.current.getContext('2d')
    const s = geometry.photoSlot
    const W = previewRef.current.width
    const H = previewRef.current.height
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.strokeRect(s.x * W, s.y * H, s.w * W, s.h * H)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillText("supporter's photo", s.x * W + 10, s.y * H + 22)
    ctx.restore()
  }, [artwork, ready, logo, geometry])

  const publish = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!artwork) return setError('Choose the event image first.')
    if (form.titleEn.trim().length < 3) return setError('An English title is needed — it makes the web address.')
    if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) {
      return setError('The web address must be lowercase letters, numbers and hyphens.')
    }

    setBusy('publishing')
    try {
      // Compose at full resolution for what actually gets stored: the artwork
      // WITHOUT the band or the type, because renderPoster draws those on top of
      // it every time it runs. Baking them in would double them up.
      const artCanvas = document.createElement('canvas')
      artCanvas.width = POSTER_W
      artCanvas.height = POSTER_H
      artCanvas.getContext('2d').drawImage(artwork, 0, 0, POSTER_W, POSTER_H)
      const artBlob = await canvasToJpeg(artCanvas, 0.9)

      // The campaign card: the top of the finished poster, which is where the
      // event image says what the campaign is. Composed through the real
      // renderer so it matches the page.
      const full = document.createElement('canvas')
      renderPoster({
        canvas: full,
        poster: { width: POSTER_W, height: POSTER_H, ...geometry },
        artwork,
        person: null,
        name: '',
        designation: '',
        logo,
        scale: 1,
      })
      const cardCanvas = document.createElement('canvas')
      renderShareCard({ canvas: cardCanvas, source: full, fromTop: true })
      const cardBlob = await canvasToJpeg(cardCanvas, 0.86)

      const [artwork64, card64] = await Promise.all([toBase64(artBlob), toBase64(cardBlob)])

      const data = await call(
        {
          action: 'create',
          slug,
          titleEn: form.titleEn.trim(),
          title: form.title.trim() || form.titleEn.trim(),
          summary: form.summary.trim(),
          issue: form.issue.trim(),
          date: form.date.trim(),
          templateVersion: TEMPLATE_VERSION,
          geometry,
          artwork: artwork64,
          card: card64,
        },
        '/api/publish-poster'
      )
      setResult(data)
      setForm({ titleEn: '', title: '', summary: '', issue: '', date: '', slug: '' })
      setSlugTouched(false)
      setArtwork(null)
      if (fileRef.current) fileRef.current.value = ''
      onPublished?.()
    } catch (err) {
      setError(err?.message || 'The poster could not be published.')
    } finally {
      setBusy(null)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={publish} className="mt-10 space-y-7">
      <p className="text-ink-600">
        Upload the event image on its own — no name, no photograph, no placeholder. Those are added
        for each supporter when they make their poster.
      </p>

      <div>
        <label className={labelCls}>1 · The event image</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="mt-3 block w-full text-sm text-ink-700 file:mr-4 file:border file:border-ink-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:border-ink-900"
        />
        <p className="mt-2 text-xs text-ink-500">
          Any size or shape — it is fitted to the poster automatically, never stretched.
        </p>
      </div>

      {artwork && (
        <div>
          <label className={labelCls}>2 · How it will look</label>
          <div className="mt-3 flex flex-wrap items-start gap-6">
            <canvas
              ref={previewRef}
              className="w-[260px] max-w-full border border-ink-200 shadow-sm"
            />
            <p className="max-w-xs text-sm leading-relaxed text-ink-600">
              The name and designation shown are an example. The dashed box is where a supporter&apos;s
              photograph will go — check it does not cover anything important in the image.
            </p>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor="p-titleEn">3 · Title in English</label>
        <input
          id="p-titleEn"
          value={form.titleEn}
          onChange={set('titleEn')}
          placeholder="Farmers protest at the Revenue Office"
          className={field}
          required
        />
        <p className="mt-2 text-xs text-ink-500">
          Web address: <code className="text-ink-700">/posters/{slug || '…'}</code>
        </p>
      </div>

      <div>
        <label className={labelCls} htmlFor="p-slug">4 · Web address (optional)</label>
        <input
          id="p-slug"
          value={slugTouched ? form.slug : slug}
          onChange={(e) => {
            setSlugTouched(true)
            setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
          }}
          className={field}
        />
        <p className="mt-2 text-xs text-ink-500">
          Leave it as it is unless you have a reason. It cannot be changed once people have the link.
        </p>
      </div>

      <div>
        <label className={labelCls} htmlFor="p-title">5 · Headline in Telugu (optional)</label>
        <input id="p-title" value={form.title} onChange={set('title')} className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="p-issue">6 · Short tag</label>
          <input id="p-issue" value={form.issue} onChange={set('issue')} placeholder="22A" className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="p-date">7 · Date shown on the page</label>
          <input id="p-date" value={form.date} onChange={set('date')} placeholder="16 September 2026" className={field} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="p-summary">8 · One sentence about it</label>
        <textarea id="p-summary" rows={3} value={form.summary} onChange={set('summary')} className={field} />
      </div>

      {error && (
        <p className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <FaTriangleExclamation className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {result && (
        <p className="flex items-start gap-2 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <FaCircleCheck className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {result.note} It will be at <code>{result.url}</code>.
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={!artwork || !ready || busy}
        className="inline-flex items-center gap-2 bg-ink-900 px-7 py-3.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaUpload aria-hidden="true" />
        {busy ? 'Publishing…' : 'Publish this poster'}
      </button>
    </form>
  )
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The image could not be prepared.'))
    reader.readAsDataURL(blob)
  })
}

export default PosterPublisher
