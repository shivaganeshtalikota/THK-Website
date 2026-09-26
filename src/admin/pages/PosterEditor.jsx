import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaUpload, FaUserLarge, FaImage, FaCircleInfo, FaUpDownLeftRight, FaWandMagicSparkles, FaImages } from 'react-icons/fa6'
import { api, uploadBlob } from '../api'
import { useContent, SITE } from '../content'
import { Button, Card, Field, LiveStatus, Notice, PageHeader, Progress, inputCls } from '../ui'
import { readImageFile, silhouette } from '../imageTools'
import LayoutOverlay from '../LayoutOverlay'
import { loadImage, ensureFonts, renderPoster, renderShareCard, canvasToJpeg, canvasToJpegUnder } from '../../lib/renderPoster'
import {
  BAR_Y,
  PERSON_SIZES,
  POSTER_H,
  POSTER_W,
  THEMES,
  chooseSide,
  composeArtwork,
  detectOwnBar,
  slugify,
  templateGeometry,
} from '../../lib/posterTemplate'

/**
 * Create or edit a campaign poster.
 *
 * Upload the event artwork, and the page shows the poster exactly as a
 * supporter will get it — the same renderer, the same fonts — with a stand-in
 * figure and a sample name. Every choice (bar colours, which side the person
 * stands, how big, whether to use a bar already in the artwork) changes the
 * preview immediately, and nothing is published until Publish is pressed.
 *
 * The side is chosen automatically by reading the artwork — whichever side has
 * less going on, so a face never lands on the headline — and can be overridden.
 */

const SAMPLE = { name: 'తాళికోట హరికృష్ణ', designation: 'ఐటీడీపీ తెలంగాణ రాష్ట్ర అధ్యక్షులు' }
const MAX_ART = 30 * 1024 * 1024

const Choice = ({ value, current, onPick, children }) => (
  <button
    type="button"
    onClick={() => onPick(value)}
    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
      current === value ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400'
    }`}
  >
    {children}
  </button>
)

let hisCutout = null // his headshot, cut out once per session for previews

/*
 * Sample photos the layout is checked against before publishing: a close
 * headshot, a speaker at a podium, and a two-person photo — the three shapes
 * supporters' photos mostly come in. Cut out once per session.
 */
const SAMPLE_PHOTOS = [
  { key: 'headshot', label: 'Headshot', src: '/photos/portrait-headshot.jpg' },
  { key: 'podium', label: 'At a podium', src: '/photos/hero-addressing.jpg' },
  { key: 'pair', label: 'Two people', src: '/photos/with-nara-lokesh.jpg' },
]
const sampleCutouts = {}

/**
 * The layout the panel suggests, as boxes the office can then drag: the
 * photo standing on the bar on the side the artwork has room for, and the
 * name across the bar beside the party mark. Mirrors what the renderer does
 * when nothing has been placed by hand.
 */
function suggestedBoxes(g) {
  const barY = g.bar.y
  const front = g.person.layer === 'front'
  const w = Math.min(0.56, g.person.maxW)
  const top = Math.max(0, barY - Math.min(g.person.h, barY - 0.04))
  // In front of the bar the photo runs to the poster's bottom edge.
  const photo = { x: g.person.side === 'left' ? 0.02 : g.person.side === 'center' ? (1 - w) / 2 : 1 - 0.02 - w, y: top, w, h: (front ? 1 : barY + 0.012) - top }
  const logoOn = g.logo.show !== false
  let x0 = logoOn && g.logo.side === 'left' ? 0.035 + g.logo.w + 0.03 : 0.035
  let x1 = logoOn && g.logo.side === 'right' ? 1 - 0.035 - g.logo.w - 0.03 : 0.965
  // A person in front of the bar takes part of it: the name goes beside them.
  if (front && g.person.side === 'right') x1 = Math.min(x1, photo.x - 0.02)
  if (front && g.person.side === 'left') x0 = Math.max(x0, photo.x + photo.w + 0.02)
  const r = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10000) / 10000]))
  return { photo: r(photo), text: r({ x: x0, y: barY, w: Math.max(0.1, x1 - x0), h: 1 - barY }) }
}

const PosterEditor = () => {
  const { slug: editSlug } = useParams()
  const navigate = useNavigate()
  const { content, reload } = useContent()
  const existing = editSlug ? content?.posters?.find((p) => p.slug === editSlug) : null
  const editing = Boolean(editSlug)

  const [form, setForm] = useState({ titleEn: '', title: '', summary: '', issue: '', date: '', slug: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [source, setSource] = useState(null) // uploaded image (new artwork)
  const [art, setArt] = useState(null) // {canvas, mode}
  const [ownBar, setOwnBar] = useState(null)
  const [design, setDesign] = useState({ theme: 'classic', side: 'auto', size: 'large', fit: 'auto', bar: 'auto', layer: 'behind', logo: 'show' })
  const [sample, setSample] = useState(SAMPLE)
  const [person, setPerson] = useState(() => silhouette())
  const [personKind, setPersonKind] = useState('silhouette')
  const [logo, setLogo] = useState(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [busy, setBusy] = useState(null) // text of what is happening
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [artChanged, setArtChanged] = useState(false)
  const [published, setPublished] = useState(false)
  const [boxes, setBoxes] = useState({ photo: null, text: null }) // placed by hand, or null = automatic
  const [adjusting, setAdjusting] = useState(false)
  const [samples, setSamples] = useState(null) // null | 'loading' | [{key,label,url}]
  const previewRef = useRef(null)
  const fileRef = useRef(null)
  const photoRef = useRef(null)

  useEffect(() => {
    Promise.all([loadImage('/tdp-logo.png'), ensureFonts()])
      .then(([mark]) => {
        setLogo(mark)
        setFontsReady(true)
      })
      .catch(() => setError('The party mark or the fonts could not be loaded. Refresh and try again.'))
  }, [])

  // Editing: start from what is published — once. Reloading the list after a
  // save hands back a new object for the same poster, and re-reading the
  // artwork then would fetch a version the site has not finished building.
  const initialised = useRef(null)
  useEffect(() => {
    if (!existing || initialised.current === existing.slug) return
    initialised.current = existing.slug
    setForm({
      titleEn: existing.titleEn || '',
      title: existing.title || '',
      summary: existing.summary || '',
      issue: existing.issue || '',
      date: existing.date || '',
      slug: existing.slug,
    })
    setSlugTouched(true)
    if (existing.templateVersion >= 3) {
      setDesign({
        theme: existing.theme || 'classic',
        side: existing.layout?.chosenBy === 'office' ? existing.person?.side || 'right' : 'auto',
        size: existing.size || 'large',
        fit: existing.layout?.fit || 'auto',
        bar: existing.bar?.paint === false ? 'own' : 'auto',
        layer: existing.person?.layer === 'front' ? 'front' : 'behind',
        logo: existing.logo?.show === false ? 'hide' : 'show',
      })
      setBoxes({ photo: existing.photoBox || null, text: existing.textBox || null })
    }
    loadImage(`/posters/${existing.slug}-v${existing.version}.jpg`)
      .then((img) => {
        const c = document.createElement('canvas')
        c.width = POSTER_W
        c.height = POSTER_H
        c.getContext('2d').drawImage(img, 0, 0, POSTER_W, POSTER_H)
        setArt({ canvas: c, mode: 'full' })
        setOwnBar(detectOwnBar(c))
      })
      .catch(() => setError('The published artwork could not be loaded.'))
  }, [existing])

  // Re-compose whenever the upload or the fit changes.
  useEffect(() => {
    if (!source) return
    const composed = composeArtwork(source, design.fit, BAR_Y)
    setArt(composed)
    setOwnBar(detectOwnBar(composed.canvas))
  }, [source, design.fit])

  const slug = slugTouched ? form.slug : slugify(form.titleEn)
  const useOwnBar = ownBar && design.bar !== 'draw'

  const geometry = useMemo(() => {
    if (!art) return null
    const barY = useOwnBar ? ownBar.y : BAR_Y
    const auto = chooseSide(art.canvas, barY)
    const side = design.side === 'auto' ? auto.side : design.side
    return {
      ...templateGeometry({
        theme: design.theme,
        side,
        size: design.size,
        ownBar: useOwnBar ? ownBar : null,
        layer: design.layer,
        showLogo: design.logo === 'show',
      }),
      ...(boxes.photo ? { photoBox: boxes.photo } : {}),
      ...(boxes.text ? { textBox: boxes.text } : {}),
      layout: { side, chosenBy: design.side === 'auto' ? 'auto' : 'office', fit: art.mode, ownBar: Boolean(useOwnBar) },
    }
  }, [art, design, ownBar, useOwnBar, boxes])

  const suggestion = useMemo(() => (geometry ? suggestedBoxes(geometry) : null), [geometry])
  const shownBoxes = suggestion ? { photo: boxes.photo || suggestion.photo, text: boxes.text || suggestion.text } : null
  const placedByHand = Boolean(boxes.photo || boxes.text)

  // Any change to the layout makes the sample check stale.
  useEffect(() => setSamples(null), [geometry])

  /** Render the poster with each sample photo, small, side by side. */
  const checkSamples = async () => {
    if (!geometry || !fontsReady) return
    setSamples('loading')
    setError(null)
    try {
      const { removeBackground } = await import('../../lib/removeBackground')
      const out = []
      for (const s of SAMPLE_PHOTOS) {
        if (!sampleCutouts[s.key]) sampleCutouts[s.key] = await removeBackground(await loadImage(s.src))
        const c = document.createElement('canvas')
        renderPoster({
          canvas: c,
          poster: { width: POSTER_W, height: POSTER_H, ...geometry },
          artwork: art.canvas,
          person: sampleCutouts[s.key],
          name: sample.name,
          designation: sample.designation,
          logo,
          scale: 0.25,
        })
        out.push({ key: s.key, label: s.label, url: c.toDataURL('image/jpeg', 0.85) })
      }
      setSamples(out)
    } catch {
      setSamples(null)
      setError('The sample photos could not be prepared. The preview above is still accurate.')
    }
  }

  // Live preview, at half size — the same renderer supporters get.
  useEffect(() => {
    if (!geometry || !previewRef.current || !fontsReady) return
    renderPoster({
      canvas: previewRef.current,
      poster: { width: POSTER_W, height: POSTER_H, ...geometry },
      artwork: art.canvas,
      person,
      name: sample.name,
      designation: sample.designation,
      logo,
      scale: 0.5,
    })
  }, [geometry, art, person, sample, logo, fontsReady])

  const pickArtwork = async (file) => {
    if (!file) return
    setError(null)
    setDone(null)
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_ART) return setError('That image is over 30 MB. Export a smaller one.')
    try {
      setSource(await readImageFile(file))
      setArtChanged(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const previewWith = useCallback(async (kind, file) => {
    setError(null)
    if (kind === 'silhouette') {
      setPerson(silhouette())
      setPersonKind('silhouette')
      return
    }
    setBusy('Cutting the photo out for the preview…')
    try {
      const { removeBackground } = await import('../../lib/removeBackground')
      if (kind === 'his') {
        if (!hisCutout) hisCutout = await removeBackground(await loadImage('/photos/portrait-headshot.jpg'))
        setPerson(hisCutout)
      } else {
        setPerson(await removeBackground(await readImageFile(file)))
      }
      setPersonKind(kind)
    } catch {
      setError('The photo could not be cut out for the preview. The silhouette is still shown.')
    } finally {
      setBusy(null)
    }
  }, [])

  const publish = async () => {
    setError(null)
    setDone(null)
    if (form.titleEn.trim().length < 3) return setError('Give the poster an English title (at least 3 characters).')
    if (!art || !geometry) return setError('Upload the event artwork first.')
    if (!editing) {
      if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) return setError('The web address may only use lowercase letters, numbers and hyphens.')
      if (content?.posters?.some((p) => p.slug === slug) || slug === '22a-patta-bhumi') {
        return setError('A poster already uses that web address. Change it below.')
      }
    }

    try {
      let artworkRef = null
      let cardRef = null
      if (!editing || artChanged) {
        setBusy('Preparing the artwork…')
        const artBlob = await canvasToJpegUnder(art.canvas, 9.5 * 1024 * 1024, { start: 0.94 })
        const card = document.createElement('canvas')
        // The campaign's own link preview: the top of the artwork, where the
        // headline is. A supporter's poster has its own card.
        renderShareCard({ canvas: card, source: art.canvas, fromTop: true })
        const cardBlob = await canvasToJpeg(card, 0.86)
        const total = artBlob.size + cardBlob.size
        setBusy('Uploading the artwork…')
        setProgress(0)
        artworkRef = await uploadBlob(artBlob, (f) => setProgress((f * artBlob.size) / total))
        cardRef = await uploadBlob(cardBlob, (f) => setProgress((artBlob.size + f * cardBlob.size) / total))
      }
      setBusy(editing ? 'Saving the changes…' : 'Publishing…')
      setProgress(null)
      const payload = {
        slug: editing ? editSlug : slug,
        titleEn: form.titleEn.trim(),
        title: form.title.trim(),
        summary: form.summary.trim(),
        issue: form.issue.trim(),
        date: form.date.trim(),
        geometry,
        ...(artworkRef ? { artwork: artworkRef, card: cardRef } : {}),
      }
      const d = await api(editing ? 'poster-update' : 'poster-publish', payload)
      setDone({ commit: d.commit, slug: payload.slug })
      setArtChanged(false)
      if (!editing) setPublished(true)
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  if (editing && content && !existing) {
    return (
      <>
        <PageHeader title="Poster not found" />
        <Link to="/posters" className="text-sm font-semibold underline">
          Back to posters
        </Link>
      </>
    )
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <Link to="/posters" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
        <FaArrowLeft className="text-xs" aria-hidden="true" /> All posters
      </Link>
      <PageHeader
        title={editing ? `Edit: ${existing?.titleEn || editSlug}` : 'Create a campaign poster'}
        subtitle="The preview is exactly what supporters will get — same layout, same fonts. Their own photo and name replace the stand-ins."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* ---- preview ---- */}
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="lg:sticky lg:top-6">
            <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
              {art ? (
                <>
                  <canvas ref={previewRef} className="block h-auto w-full" aria-label="Poster preview" />
                  {adjusting && shownBoxes && (
                    <LayoutOverlay boxes={shownBoxes} onChange={(k, b) => setBoxes((x) => ({ ...x, [k]: b }))} />
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-[4/5] w-full place-items-center bg-ink-50 text-center transition hover:bg-ink-100"
                >
                  <span>
                    <FaUpload className="mx-auto text-3xl text-ink-400" aria-hidden="true" />
                    <span className="mt-3 block font-semibold text-ink-800">Upload the event artwork</span>
                    <span className="mt-1 block text-sm text-ink-500">JPG or PNG, up to 30 MB. Portrait (4:5) fills the poster best.</span>
                  </span>
                </button>
              )}
            </div>
            {art && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink-500">Preview with:</span>
                <Choice value="silhouette" current={personKind} onPick={() => previewWith('silhouette')}>
                  <FaUserLarge className="mr-1 inline" aria-hidden="true" /> Silhouette
                </Choice>
                <Choice value="his" current={personKind} onPick={() => previewWith('his')}>
                  His photo
                </Choice>
                <Choice value="file" current={personKind} onPick={() => photoRef.current?.click()}>
                  A photo…
                </Choice>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) previewWith('file', f)
                  }}
                />
              </div>
            )}
            {art && (
              <div className="mt-4 rounded-xl border border-ink-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-800">
                    Layout: {placedByHand ? 'placed by hand' : 'suggested automatically'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={adjusting ? 'primary' : 'ghost'} onClick={() => setAdjusting((a) => !a)}>
                      <FaUpDownLeftRight aria-hidden="true" /> {adjusting ? 'Done adjusting' : 'Move or resize'}
                    </Button>
                    {placedByHand && (
                      <Button variant="ghost" onClick={() => setBoxes({ photo: null, text: null })}>
                        <FaWandMagicSparkles aria-hidden="true" /> Use the suggestion
                      </Button>
                    )}
                  </div>
                </div>
                {adjusting && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    Drag the <strong>Photo</strong> box or the <strong>Name</strong> box to move it; drag its round corner to resize.
                    Supporters’ photos are fitted inside the photo box, whole; the name and designation are centred in the name box.
                  </p>
                )}
                <div className="mt-3">
                  <Button variant="ghost" onClick={checkSamples} busy={samples === 'loading'} disabled={!fontsReady}>
                    <FaImages aria-hidden="true" /> Check with sample photos
                  </Button>
                  {samples === 'loading' && <span className="ml-3 text-xs text-ink-500">Cutting out three sample photos…</span>}
                </div>
                {Array.isArray(samples) && (
                  <ul className="mt-3 grid grid-cols-3 gap-2">
                    {samples.map((s) => (
                      <li key={s.key}>
                        <img src={s.url} alt={`Poster with a sample photo: ${s.label}`} className="w-full rounded border border-ink-200" />
                        <span className="mt-1 block text-center text-[0.7rem] text-ink-500">{s.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---- settings ---- */}
        <div className="space-y-6 lg:col-span-6 xl:col-span-7">
          <Card title="1. Artwork" subtitle="The event image supporters put themselves on.">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                pickArtwork(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={art ? 'ghost' : 'brand'} onClick={() => fileRef.current?.click()}>
                <FaImage aria-hidden="true" /> {art ? 'Replace artwork' : 'Upload artwork'}
              </Button>
              {source && (
                <span className="text-sm text-ink-500">
                  {source.width}×{source.height}px
                </span>
              )}
            </div>
            {source && (
              <div className="mt-4">
                <p className="text-[0.8rem] font-semibold text-ink-700">How the artwork fills the poster</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Choice value="auto" current={design.fit} onPick={(v) => setDesign((d) => ({ ...d, fit: v }))}>
                    Automatic
                  </Choice>
                  <Choice value="full" current={design.fit} onPick={(v) => setDesign((d) => ({ ...d, fit: v }))}>
                    Fill the whole poster
                  </Choice>
                  <Choice value="above-bar" current={design.fit} onPick={(v) => setDesign((d) => ({ ...d, fit: v }))}>
                    Keep it all above the bar
                  </Choice>
                </div>
              </div>
            )}
          </Card>

          <Card title="2. Name bar" subtitle="Where the supporter's name and designation go.">
            <p className="text-[0.8rem] font-semibold text-ink-700">Party logo</p>
            <div className="mb-5 mt-2 flex flex-wrap gap-2">
              <Choice value="show" current={design.logo} onPick={(v) => setDesign((d) => ({ ...d, logo: v }))}>
                Show the party logo
              </Choice>
              <Choice value="hide" current={design.logo} onPick={(v) => setDesign((d) => ({ ...d, logo: v }))}>
                No logo
              </Choice>
            </div>
            {ownBar && (
              <div className="mb-4">
                <Notice tone="info">
                  <FaCircleInfo className="mr-1 inline" aria-hidden="true" />
                  This artwork already has an empty bar at the bottom. It is used for the name, instead of drawing a new one.
                </Notice>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Choice value="auto" current={design.bar} onPick={(v) => setDesign((d) => ({ ...d, bar: v }))}>
                    Use the artwork’s bar
                  </Choice>
                  <Choice value="draw" current={design.bar} onPick={(v) => setDesign((d) => ({ ...d, bar: v }))}>
                    Draw our own bar
                  </Choice>
                </div>
              </div>
            )}
            {!useOwnBar && (
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDesign((d) => ({ ...d, theme: key }))}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${
                      design.theme === key ? 'border-ink-900 ring-2 ring-ink-900/10' : 'border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    <span className="grid h-10 w-16 shrink-0 place-items-center rounded border border-ink-200" style={{ background: t.bar, borderTop: `3px solid ${t.rule}` }}>
                      <span className="text-[0.6rem] font-extrabold leading-tight" style={{ color: t.name }}>
                        NAME
                        <span className="block text-[0.5rem]" style={{ color: t.designation }}>
                          ROLE
                        </span>
                      </span>
                    </span>
                    <span className="font-medium text-ink-800">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="3. The person" subtitle="Supporters' photos stand on the bar, cut out automatically.">
            <p className="text-[0.8rem] font-semibold text-ink-700">Side</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ['auto', `Automatic${geometry && design.side === 'auto' ? ` (${geometry.layout.side})` : ''}`],
                ['left', 'Left'],
                ['center', 'Centre'],
                ['right', 'Right'],
              ].map(([v, l]) => (
                <Choice key={v} value={v} current={design.side} onPick={(x) => setDesign((d) => ({ ...d, side: x }))}>
                  {l}
                </Choice>
              ))}
            </div>
            <p className="mt-4 text-[0.8rem] font-semibold text-ink-700">Photo and name bar</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Choice value="behind" current={design.layer} onPick={(v) => setDesign((d) => ({ ...d, layer: v }))}>
                Behind the name bar
              </Choice>
              <Choice value="front" current={design.layer} onPick={(v) => setDesign((d) => ({ ...d, layer: v }))}>
                In front of the name bar
              </Choice>
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              {design.layer === 'front'
                ? 'The person stands on the poster’s bottom edge, over the bar; the name moves beside them so it is never covered.'
                : 'The bar covers the bottom of the photo, like a person standing behind a banner.'}
            </p>
            <p className="mt-4 text-[0.8rem] font-semibold text-ink-700">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(PERSON_SIZES).map(([k, s]) => (
                <Choice key={k} value={k} current={design.size} onPick={(x) => setDesign((d) => ({ ...d, size: x }))}>
                  {s.label}
                </Choice>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Sample name (preview only)">
                <input className={inputCls} value={sample.name} onChange={(e) => setSample((s) => ({ ...s, name: e.target.value }))} />
              </Field>
              <Field label="Sample designation (preview only)">
                <input className={inputCls} value={sample.designation} onChange={(e) => setSample((s) => ({ ...s, designation: e.target.value }))} />
              </Field>
            </div>
          </Card>

          <Card title="4. Details" subtitle="Shown on the posters page and in link previews.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="English title *" className="sm:col-span-2" hint="Also used for the web address.">
                <input className={inputCls} value={form.titleEn} onChange={set('titleEn')} placeholder="e.g. Vinayaka Chavithi greetings" />
              </Field>
              <Field label="Telugu headline" className="sm:col-span-2">
                <input lang="te" className={inputCls} value={form.title} onChange={set('title')} placeholder="వినాయక చవితి శుభాకాంక్షలు" />
              </Field>
              <Field label="Short tag" hint="A word or two, e.g. “Vinayaka Chavithi” or “22A”.">
                <input className={inputCls} value={form.issue} onChange={set('issue')} maxLength={24} />
              </Field>
              <Field label="Date (optional)">
                <input className={inputCls} value={form.date} onChange={set('date')} placeholder="7 September 2026" />
              </Field>
              <Field label="One-line summary" className="sm:col-span-2">
                <textarea className={`${inputCls} min-h-[5rem]`} value={form.summary} onChange={set('summary')} maxLength={600} />
              </Field>
              <Field
                label="Web address"
                className="sm:col-span-2"
                hint={editing ? 'Fixed once published, so shared links keep working.' : `${SITE}/posters/${slug || '…'}`}
              >
                <input
                  className={`${inputCls} font-mono text-sm`}
                  value={slug}
                  disabled={editing}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
                  }}
                />
              </Field>
            </div>
          </Card>

          {error && <Notice tone="error">{error}</Notice>}
          {busy && (
            <div className="rounded-xl border border-ink-200 bg-white p-4">
              {progress !== null ? (
                <Progress value={progress} label={busy} />
              ) : (
                <p className="flex items-center gap-2.5 text-sm text-ink-700">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" aria-hidden="true" />
                  {busy}
                </p>
              )}
            </div>
          )}
          {done && <LiveStatus commit={done.commit} message={editing ? 'Changes saved.' : 'Poster published.'} link={`${SITE}/posters/${done.slug}`} />}

          <div className="flex flex-wrap gap-3">
            {published ? (
              <>
                <Button variant="brand" onClick={() => navigate(0)}>
                  Create another poster
                </Button>
                <Link to="/posters" className="inline-flex items-center rounded-md border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800">
                  Back to posters
                </Link>
              </>
            ) : (
              <Button variant="brand" onClick={publish} busy={Boolean(busy)} disabled={!art}>
                {editing ? 'Save changes' : 'Publish poster'}
              </Button>
            )}
            <Link to="/posters" className="inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default PosterEditor
