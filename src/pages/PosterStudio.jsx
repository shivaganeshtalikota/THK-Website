import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaDownload,
  FaShareNodes,
  FaWhatsapp,
  FaXTwitter,
  FaFacebookF,
  FaCamera,
  FaCircleCheck,
  FaTriangleExclamation,
  FaWandMagicSparkles,
  FaCopy,
  FaPenToSquare,
  FaRotateRight,
} from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import NotFound from './NotFound'
import { site } from '../data/site'
import { posterBySlug, posterImage, posterCard } from '../data/posters'
import {
  loadImage,
  ensureFonts,
  renderPoster,
  renderShareCard,
  canvasToJpeg,
  canvasToJpegUnder,
} from '../lib/renderPoster'
import { buildShareUrl, shareMessage, uploadPoster } from '../lib/posterLink'
import { useT } from '../i18n/useT'

/**
 * Put your name and face on a campaign poster, then share it.
 *
 * THE FLOW. Photo, name, designation, then Generate. The office asked for a
 * button rather than a live preview: a poster that re-assembles itself while
 * somebody is half-way through typing looks broken, and "Generated" is the
 * moment people wait for before they share.
 *
 * AFTER GENERATE, the poster is saved straight away so the link can show it —
 * with a progress bar, because on a phone a 2MB upload takes long enough that
 * silence looks like a hang. Download works immediately and never waits for
 * the upload. If saving fails the poster is still finished; only the link is
 * affected, and there is a retry.
 *
 * THE PHOTOGRAPH ITSELF IS NEVER UPLOADED. It is read from the file input,
 * matted by a model running in this tab, and drawn to a canvas. What is stored
 * for the link is the finished poster and its preview card, for thirty days.
 */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
/** Under Vercel's request cap once the card rides along. */
const MAX_POSTER_BYTES = 3.9 * 1024 * 1024

const STAGE_LABEL = {
  reading: 'Reading your photo…',
  model: 'Getting the background remover ready — the first time takes a little longer…',
  matting: 'Finding you in the photo…',
  refining: 'Sharpening the edges…',
  finishing: 'Finishing the cut-out…',
  generating: 'Generating your poster…',
}

const PosterStudio = () => {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const t = useT()
  const poster = posterBySlug(slug)
  const lang = pathname.startsWith('/te') ? 'te' : 'en'

  const canvasRef = useRef(null)
  const artworkRef = useRef(null)
  const personRef = useRef(null)
  const logoRef = useRef(null)
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(null) // null | stage key
  const [photoState, setPhotoState] = useState('none') // none | done | failed
  const [error, setError] = useState(null)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  // The saved copy the link points at.
  const [save, setSave] = useState({ state: 'idle', progress: 0, id: null, error: null })

  /*
   * Which generation of the poster is on screen. Saving is asynchronous and
   * editing is not, so without this "generate, edit the name, generate again"
   * could attach the FIRST poster's id to the SECOND poster's link — a link
   * showing a name the poster no longer carries.
   */
  const generation = useRef(0)

  const ogImage = useMemo(
    () =>
      poster ? { url: `${site.url}${posterCard(poster)}`, width: 1200, height: 630, alt: poster.titleEn } : undefined,
    [poster],
  )

  // Artwork, party mark and fonts; then the blank poster, so the page shows
  // the real artwork at once rather than a placeholder.
  useEffect(() => {
    if (!poster) return
    let alive = true
    ;(async () => {
      try {
        const needsMark = poster.templateVersion >= 3 || Boolean(poster.band)
        const [art, mark] = await Promise.all([
          loadImage(posterImage(poster)),
          needsMark ? loadImage('/tdp-logo.png') : Promise.resolve(null),
          ensureFonts(),
        ])
        if (!alive) return
        artworkRef.current = art
        logoRef.current = mark
        setReady(true)
      } catch {
        if (alive) setError('The poster artwork could not be loaded. Please refresh and try again.')
      }
    })()
    return () => {
      alive = false
    }
  }, [poster])

  useEffect(() => {
    if (!ready || generated) return
    renderPoster({
      canvas: canvasRef.current,
      poster,
      artwork: artworkRef.current,
      person: null,
      name: '',
      designation: '',
      logo: logoRef.current,
    })
  }, [ready, generated, poster])

  /** Any edit after generating invalidates the result and its link. */
  const invalidate = useCallback(() => {
    generation.current += 1
    setGenerated(false)
    setCopied(false)
    setSave({ state: 'idle', progress: 0, id: null, error: null })
  }, [])

  /** Start the model download while the file picker is open. */
  const openPicker = useCallback(() => {
    fileInputRef.current?.click()
    import('../lib/removeBackground').then((m) => m.prewarm()).catch(() => {})
  }, [])

  const handleFile = useCallback(
    async (file) => {
      if (!file) return
      setError(null)
      invalidate()
      if (!file.type.startsWith('image/')) {
        setError('That file is not an image. Please choose a photograph.')
        return
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('That photograph is very large. Please choose one under 25 MB.')
        return
      }
      setBusy('reading')
      const url = URL.createObjectURL(file)
      try {
        const img = await loadImage(url)
        personRef.current = img
        try {
          const { removeBackground } = await import('../lib/removeBackground')
          personRef.current = await removeBackground(img, { onStage: (s) => setBusy(s) })
          setPhotoState('done')
        } catch (err) {
          console.error('Background removal failed:', err)
          // Not fatal: the poster still works with the photograph as it is.
          setPhotoState('failed')
        }
      } catch {
        setError('That photograph could not be opened. Please try another one.')
        setPhotoState('none')
      } finally {
        setBusy(null)
        URL.revokeObjectURL(url)
      }
    },
    [invalidate],
  )

  /** Save the poster so the link shows it. Safe to call again to retry. */
  const saveForLink = useCallback(async () => {
    if (!canvasRef.current || !poster) return
    const mine = generation.current
    setSave({ state: 'saving', progress: 0, id: null, error: null })
    try {
      const card = document.createElement('canvas')
      renderShareCard({ canvas: card, source: canvasRef.current })
      const [cardBlob, posterBlob] = await Promise.all([
        canvasToJpeg(card, 0.86),
        canvasToJpegUnder(canvasRef.current, MAX_POSTER_BYTES),
      ])
      const id = await uploadPoster({
        slug: poster.slug,
        card: cardBlob,
        poster: posterBlob,
        onProgress: (f) => {
          if (generation.current === mine) setSave((s) => ({ ...s, progress: f }))
        },
      })
      if (generation.current !== mine) return
      setSave({ state: 'saved', progress: 1, id, error: null })
    } catch (err) {
      if (generation.current !== mine) return
      setSave({ state: 'failed', progress: 0, id: null, error: err?.message || 'Your poster could not be saved just now.' })
    }
  }, [poster])

  const canGenerate = ready && photoState !== 'none' && name.trim().length > 0 && !busy

  const generate = useCallback(async () => {
    if (!canGenerate) return
    setBusy('generating')
    setError(null)
    try {
      // One frame so the button's state paints before a 2048x2560 composite
      // takes the main thread.
      await new Promise((r) => requestAnimationFrame(() => r()))
      renderPoster({
        canvas: canvasRef.current,
        poster,
        artwork: artworkRef.current,
        person: personRef.current,
        name: name.trim(),
        designation: designation.trim(),
        logo: logoRef.current,
      })
      generation.current += 1
      setGenerated(true)
      requestAnimationFrame(() => {
        document.getElementById('poster-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      saveForLink()
    } catch {
      setError('The poster could not be generated. Please try again.')
    } finally {
      setBusy(null)
    }
  }, [canGenerate, poster, name, designation, saveForLink])

  const filename = `${poster?.slug ?? 'poster'}-${(name || 'poster')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.jpg`

  const download = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToJpeg(canvasRef.current, 0.95)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setError('The poster could not be saved. Please try again.')
    }
  }, [filename])

  const shareUrl = poster
    ? buildShareUrl({
        origin: typeof window !== 'undefined' ? window.location.origin : site.url,
        slug: poster.slug,
        id: save.id,
        lang,
      })
    : ''

  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

  /** The phone's share sheet, with the actual JPG — the only route to Instagram. */
  const shareNative = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToJpeg(canvasRef.current, 0.92)
      const file = new File([blob], filename, { type: 'image/jpeg' })
      const text = shareMessage({ poster, url: shareUrl })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        return
      }
      await navigator.share({ text, url: shareUrl })
    } catch (err) {
      if (err?.name !== 'AbortError') await download()
    }
  }, [download, filename, poster, shareUrl])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy the link. Select and copy it by hand.')
    }
  }, [shareUrl])

  if (!poster) return <NotFound />

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${site.url}/posters/${poster.slug}#webpage`,
        name: `Create your own poster — ${poster.titleEn}`,
        url: `${site.url}/posters/${poster.slug}`,
        isPartOf: { '@id': `${site.url}/#website` },
      },
    ],
  }

  const msg = shareMessage({ poster, url: shareUrl })
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${poster.title}\n\n`)}&url=${encodeURIComponent(shareUrl)}`
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const linkReady = save.state === 'saved' || save.state === 'failed'

  return (
    <>
      <Seo
        title={`Create your poster — ${poster.issue}`}
        description={`Put your name, designation and photo on the ${poster.issue} campaign poster and share it. Free, works on a phone, and your photo never leaves your device.`}
        image={ogImage}
        schema={schema}
      />

      <section className="section bg-ink-50">
        <div className="container-custom">
          <Link
            to="/posters"
            className="inline-flex items-center gap-2 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-600 hover:text-ink-900"
          >
            <FaArrowLeft className="text-xs" aria-hidden="true" />
            {t('All posters')}
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* ---- Preview ------------------------------------------------ */}
            <div id="poster-result" className="scroll-mt-24 lg:col-span-6 xl:col-span-7">
              <div className="sticky top-[calc(var(--nav-h)+1.5rem)]">
                <div
                  className={`relative overflow-hidden rounded-sm border bg-white shadow-frame transition-colors ${
                    generated ? 'border-brand-500' : 'hairline'
                  }`}
                >
                  <canvas ref={canvasRef} className="block h-auto w-full" aria-label={t('Your poster')} role="img" />
                  {busy && busy !== 'generating' && (
                    <div className="absolute inset-0 grid place-items-center bg-ink-950/45 backdrop-blur-[2px]">
                      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/30 border-t-white" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {busy && (
                  <p className="mt-4 flex items-center gap-3 rounded-sm bg-ink-900 px-4 py-3 text-sm text-white" role="status">
                    <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                    {t(STAGE_LABEL[busy] || 'Working…')}
                  </p>
                )}

                {generated && !busy && (
                  <p className="mt-4 flex items-center gap-2.5 rounded-sm bg-brand-500 px-4 py-3 font-sans text-sm font-semibold text-ink-900" role="status">
                    <FaCircleCheck className="shrink-0" aria-hidden="true" />
                    {t('Your poster is ready. Download it or share it below.')}
                  </p>
                )}

                {!busy && !generated && photoState === 'done' && (
                  <p className="mt-4 flex items-center gap-2.5 text-sm text-ink-600">
                    <FaCircleCheck className="shrink-0 text-brand-700" aria-hidden="true" />
                    {t('Background removed. Add your name, then press Generate.')}
                  </p>
                )}

                {!busy && photoState === 'failed' && (
                  <p className="mt-4 flex items-start gap-2.5 rounded-sm bg-brand-500/15 px-4 py-3 text-sm text-ink-700">
                    <FaTriangleExclamation className="mt-0.5 shrink-0 text-brand-800" aria-hidden="true" />
                    <span>
                      {t(
                        'The background could not be removed on this device, so your photo is being used as it is. The poster still works — or try a photo with a plainer background.',
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* ---- Controls ----------------------------------------------- */}
            <div className="lg:col-span-6 xl:col-span-5">
              <p className="eyebrow">{poster.issue}</p>
              <h1 className="mt-4 font-display text-display">{t('Create your own poster')}</h1>
              <p lang="te" className="mt-4 text-lead text-ink-600">
                {poster.title}
              </p>

              <div className="mt-10 space-y-8">
                {!generated && (
                  <>
                    {/* 1 — photo */}
                    <div>
                      <label htmlFor="poster-photo" className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                        {t('1. Your photograph')}
                      </label>
                      <p className="mt-2 text-sm leading-relaxed text-ink-600">
                        {t(
                          'A clear, front-facing photo from the chest up works best. The background is removed automatically, so it does not need to be plain — but good light helps.',
                        )}
                      </p>
                      <input
                        ref={fileInputRef}
                        id="poster-photo"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          handleFile(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                      <button type="button" onClick={openPicker} className="btn-outline mt-4" disabled={!ready || !!busy}>
                        <FaCamera aria-hidden="true" />
                        {photoState === 'none' ? t('Choose photo') : t('Change photo')}
                      </button>
                      {photoState !== 'none' && !busy && (
                        <p className="mt-3 flex items-center gap-2 text-sm text-ink-600">
                          <FaCircleCheck className="shrink-0 text-brand-700" aria-hidden="true" />
                          {t('Photo added')}
                        </p>
                      )}
                    </div>

                    {/* 2 — name */}
                    <div>
                      <label htmlFor="poster-name" className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                        {t('2. Your name')}
                      </label>
                      <input
                        id="poster-name"
                        type="text"
                        value={name}
                        maxLength={44}
                        onChange={(e) => {
                          setName(e.target.value)
                          invalidate()
                        }}
                        placeholder={t('e.g. Talikota Hari Krishna')}
                        className="mt-3 w-full rounded-sm border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/15"
                      />
                      <p className="mt-2 text-xs text-ink-500">{t('Telugu or English — both work.')}</p>
                    </div>

                    {/* 3 — designation */}
                    <div>
                      <label htmlFor="poster-designation" className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                        {t('3. Your designation')}
                      </label>
                      <input
                        id="poster-designation"
                        type="text"
                        value={designation}
                        maxLength={70}
                        onChange={(e) => {
                          setDesignation(e.target.value)
                          invalidate()
                        }}
                        placeholder={t('e.g. iTDP Telangana State President')}
                        className="mt-3 w-full rounded-sm border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/15"
                      />
                      <p className="mt-2 text-xs text-ink-500">{t('A long designation goes onto two lines by itself.')}</p>
                    </div>
                  </>
                )}

                {error && (
                  <p className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {t(error)}
                  </p>
                )}

                {/* 4 — generate, then the result */}
                <div className={generated ? '' : 'border-t hairline pt-8'}>
                  {!generated ? (
                    <>
                      <button type="button" onClick={generate} className="btn-brand w-full justify-center sm:w-auto" disabled={!canGenerate}>
                        <FaWandMagicSparkles aria-hidden="true" />
                        {busy === 'generating' ? t('Generating…') : t('Generate image')}
                      </button>
                      {!canGenerate && !busy && (
                        <p className="mt-3 text-xs text-ink-500">
                          {photoState === 'none'
                            ? t('Add a photo and your name to generate the poster.')
                            : t('Add your name to generate the poster.')}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-7">
                      <div>
                        <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">{t('Save it')}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button type="button" onClick={download} className="btn-primary">
                            <FaDownload aria-hidden="true" />
                            {t('Download JPG')}
                          </button>
                          {canShareFiles && (
                            <button type="button" onClick={shareNative} className="btn-outline">
                              <FaShareNodes aria-hidden="true" />
                              {t('Share')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">{t('Share the link')}</p>

                        {save.state === 'saving' && (
                          <div className="mt-4 rounded-sm border border-ink-200 bg-white p-4" role="status" aria-live="polite">
                            <p className="flex items-center gap-2.5 text-sm text-ink-700">
                              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" aria-hidden="true" />
                              {t('Saving your poster for the link…')} {Math.round(save.progress * 100)}%
                            </p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                              <div className="h-full rounded-full bg-brand-500 transition-[width] duration-200" style={{ width: `${Math.max(4, save.progress * 100)}%` }} />
                            </div>
                          </div>
                        )}

                        {save.state === 'saved' && (
                          <p className="mt-4 flex items-start gap-2 text-sm text-ink-700">
                            <FaCircleCheck className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
                            {t('Anyone who opens your link sees this poster, full size, and can make their own.')}
                          </p>
                        )}

                        {save.state === 'failed' && (
                          <div className="mt-4 rounded-sm bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                            <p>
                              {t(save.error)} {t('The link below opens the campaign page instead.')}
                            </p>
                            <button type="button" onClick={saveForLink} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
                              <FaRotateRight className="text-xs" aria-hidden="true" />
                              {t('Try saving again')}
                            </button>
                          </div>
                        )}

                        {linkReady && (
                          <>
                            <div className="mt-4 flex items-stretch gap-2">
                              <input
                                readOnly
                                value={shareUrl}
                                onFocus={(e) => e.target.select()}
                                aria-label={t('Your poster link')}
                                className="min-w-0 flex-1 rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-mono text-xs text-ink-700"
                              />
                              <button
                                type="button"
                                onClick={copyLink}
                                className="tap-round shrink-0 rounded-sm bg-ink-900 px-4 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-ink-800"
                              >
                                {copied ? t('Copied') : <FaCopy aria-hidden="true" />}
                              </button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
                                <FaWhatsapp aria-hidden="true" />
                                {t('WhatsApp')}
                              </a>
                              <a href={xHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
                                <FaXTwitter aria-hidden="true" />
                                {t('Post on X')}
                              </a>
                              <a href={fbHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
                                <FaFacebookF aria-hidden="true" />
                                {t('Facebook')}
                              </a>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={invalidate}
                        className="inline-flex items-center gap-2 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-600 hover:text-ink-900"
                      >
                        <FaPenToSquare className="text-xs" aria-hidden="true" />
                        {t('Edit and generate again')}
                      </button>
                    </div>
                  )}
                </div>

                <p className="rounded-sm bg-ink-900 px-4 py-3.5 text-xs leading-relaxed text-white/75">
                  {t(
                    'Your photograph is never uploaded: the background is removed and the poster is made inside your browser. When you generate a poster, the finished image is saved so your link can show it, and it is deleted after 30 days. There is no account.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default PosterStudio
