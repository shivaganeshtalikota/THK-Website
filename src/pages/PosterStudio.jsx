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
  FaImage,
} from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import NotFound from './NotFound'
import { site } from '../data/site'
import { posterBySlug, posterImage, posterCard } from '../data/posters'
import { loadImage, ensureFonts, renderPoster, renderShareCard, canvasToJpeg } from '../lib/renderPoster'
import { buildShareUrl, readShareToken, shareMessage, uploadShareCard } from '../lib/posterLink'
import { useT } from '../i18n/useT'

/**
 * Put your name and face on a campaign poster, then share it.
 *
 * THE FLOW IS DELIBERATE. Photo, name, designation, then a Generate button —
 * not a live preview that updates as you type. The office asked for it this
 * way and they were right: a poster that assembles itself while somebody is
 * still half-way through typing their designation looks broken, and there is no
 * moment where the thing is finished. A button gives that moment, and
 * "Generated" is what people wait for before they will share something.
 *
 * THE PHOTOGRAPH IS NEVER UPLOADED. It is read from the file input, segmented
 * by a model running in this tab, and drawn to a canvas. It never reaches a
 * server. That is the right default when you are asking people for a picture of
 * their own face, and it is also the only way this is affordable at campaign
 * volume, where every hosted background-removal API bills per image.
 *
 * ONE THING CAN LEAVE, AND ONLY IF ASKED. Link-preview crawlers do not run
 * JavaScript and will not read a data: URL, so for WhatsApp to show somebody
 * their own poster that image has to exist at a URL when the crawler asks.
 * Pressing "Show my poster in the link preview" uploads the 1200x630 card —
 * never the photograph, never the full-size poster — which is stored under an
 * unguessable id and deleted after thirty days. Nobody who does not press it
 * uploads anything, which is what lets the copy on this page stay literally
 * true rather than carefully worded.
 */

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

const PosterStudio = () => {
  const { slug } = useParams()
  const { search, pathname } = useLocation()
  const t = useT()
  const poster = posterBySlug(slug)
  // The site prerenders an English and a Telugu tree; a link made on /te must
  // send its recipients to /te, and tell the crawler so.
  const lang = pathname.startsWith('/te') ? 'te' : 'en'

  const canvasRef = useRef(null)
  const artworkRef = useRef(null)
  const personRef = useRef(null)
  const logoRef = useRef(null)
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(null) // null | 'loading-model' | 'cutting' | 'generating'
  const [photoState, setPhotoState] = useState('none') // none | raw | done | failed
  const [cutoutError, setCutoutError] = useState(null)
  const [error, setError] = useState(null)
  const [generated, setGenerated] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [cardId, setCardId] = useState(null)
  const [cardError, setCardError] = useState(null)
  // Previews need server-side storage. Until that is configured the offer is
  // withdrawn rather than left as a button that cannot work — nothing else on
  // the page depends on it, so there is nothing to explain to a visitor.
  const [previewOffered, setPreviewOffered] = useState(true)

  /*
   * Which generation of the poster is on screen.
   *
   * Uploading the preview card is asynchronous and invalidate() is not, so
   * without this the sequence "opt in, edit the name, generate again" can land
   * an id belonging to the PREVIOUS poster on the new link — a preview showing
   * a name the poster no longer carries, which is the worst possible failure
   * here because nobody would notice until it had been forwarded. Every
   * invalidation bumps the counter and a reply from a superseded generation is
   * dropped.
   */
  const generation = useRef(0)

  /*
   * The social card for this campaign.
   *
   * Memoised because Seo keys its whole head block on the identity of this
   * prop; a fresh object literal every render would rebuild and re-apply every
   * meta tag on the page on every keystroke in the name field.
   */
  const ogImage = useMemo(
    () =>
      poster
        ? {
            url: `${site.url}${posterCard(poster)}`,
            width: 1200,
            height: 630,
            alt: poster.titleEn,
          }
        : undefined,
    [poster]
  )

  /*
   * Somebody arriving from a shared link gets that person's name already in the
   * fields. They are one photo away from their own poster, which is the whole
   * point of the link existing.
   */
  useEffect(() => {
    const from = readShareToken(search)
    if (from) {
      setName(from.name)
      setDesignation(from.designation)
    }
  }, [search])

  const draw = useCallback(() => {
    if (!canvasRef.current || !artworkRef.current || !poster) return
    renderPoster({
      canvas: canvasRef.current,
      poster,
      artwork: artworkRef.current,
      person: personRef.current,
      name,
      designation,
      logo: logoRef.current,
      scale: 1,
    })
  }, [poster, name, designation])

  // Load artwork + fonts, then draw the blank poster so the page shows the real
  // artwork straight away rather than a placeholder.
  useEffect(() => {
    if (!poster) return
    let alive = true
    ;(async () => {
      try {
        /*
         * The party mark is only fetched for a poster whose footer this code
         * draws. The 22A artwork has its own baked in, so loading a second copy
         * to paint over it would be a wasted request on the page most likely to
         * be opened on a slow phone.
         */
        const [art, mark] = await Promise.all([
          loadImage(posterImage(poster)),
          poster.band ? loadImage('/tdp-logo.png') : Promise.resolve(null),
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

  // Before generating, the canvas shows the artwork alone — the name is not
  // drawn until they ask for it, so the Generate button has something to do.
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
      scale: 1,
    })
  }, [ready, generated, poster])

  /** Any edit after generating invalidates the result. */
  const invalidate = useCallback(() => {
    generation.current += 1
    setGenerated(false)
    setShareUrl('')
    setCopied(false)
    setCardId(null)
    setCardError(null)
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
        setError('That photograph is very large. Please choose one under 12 MB.')
        return
      }

      const url = URL.createObjectURL(file)
      try {
        const img = await loadImage(url)
        personRef.current = img
        setPhotoState('raw')

        setBusy('loading-model')
        const { removeBackground } = await import('../lib/removeBackground')
        setBusy('cutting')
        const cut = await removeBackground(img)
        personRef.current = cut
        setPhotoState('done')
        setCutoutError(null)
      } catch (err) {
        console.error('Background removal failed:', err)
        // Not an error state: the poster still works with the photo as-is.
        setCutoutError(err?.message ? String(err.message).slice(0, 180) : null)
        setPhotoState('failed')
      } finally {
        setBusy(null)
        URL.revokeObjectURL(url)
      }
    },
    [invalidate]
  )

  const canGenerate = ready && photoState !== 'none' && name.trim().length > 0 && !busy

  const generate = useCallback(async () => {
    if (!canGenerate) return
    setBusy('generating')
    setError(null)
    try {
      // A frame so the button's own state paints before the main thread is
      // taken by a 2048x2560 composite.
      await new Promise((r) => requestAnimationFrame(() => r()))
      draw()
      setShareUrl(
        buildShareUrl({
          origin: typeof window !== 'undefined' ? window.location.origin : site.url,
          slug: poster.slug,
          name: name.trim(),
          designation: designation.trim(),
          lang,
        })
      )
      setGenerated(true)
      // Bring the finished poster into view on a phone, where the controls sit
      // below it and the result would otherwise be off-screen.
      requestAnimationFrame(() => {
        document.getElementById('poster-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    } catch {
      setError('The poster could not be generated. Please try again.')
    } finally {
      setBusy(null)
    }
  }, [canGenerate, draw, name, designation, poster, lang])

  const filename = `${poster?.slug ?? 'poster'}-${(name || 'poster')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.jpg`

  const download = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToJpeg(canvasRef.current, 0.92)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revoked late: revoking synchronously can cancel the download in some
      // browsers before they have read the blob.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setError('The poster could not be saved. Please try again.')
    }
  }, [filename])

  /**
   * Opt in to showing this poster in the link preview.
   *
   * Deliberately a button rather than something that happens on Generate. It is
   * the only moment in this whole tool when anything leaves the device, so it
   * should be a thing somebody chose, with the consequence written next to it —
   * not a default they would have to notice to avoid.
   *
   * A failure here is not a failure of the poster. The poster is finished,
   * downloadable and shareable as a file regardless; only the preview image is
   * affected, and the plain link keeps working. So this reports and stops
   * rather than unwinding anything.
   */
  const enablePreview = useCallback(async () => {
    if (!canvasRef.current || !poster || busy) return
    const mine = generation.current
    setBusy('preview')
    setCardError(null)
    try {
      const card = document.createElement('canvas')
      renderShareCard({ canvas: card, source: canvasRef.current })
      // 0.86 rather than the poster's 0.92: this is a thumbnail in a chat app,
      // and the byte ceiling matters more here than the last few percent of
      // quality. It lands around 150KB.
      const blob = await canvasToJpeg(card, 0.86)
      const id = await uploadShareCard({ blob, slug: poster.slug })
      // Dropped if the poster changed underneath us — see `generation`.
      if (generation.current !== mine) return
      setCardId(id)
      setShareUrl(
        buildShareUrl({
          origin: typeof window !== 'undefined' ? window.location.origin : site.url,
          slug: poster.slug,
          name: name.trim(),
          designation: designation.trim(),
          cardId: id,
          lang,
        })
      )
    } catch (err) {
      if (generation.current !== mine) return
      if (err?.status === 501 || err?.status === 503) {
        setPreviewOffered(false)
        setCardError(null)
        return
      }
      setCardError(err?.message || 'The link preview could not be saved just now.')
    } finally {
      setBusy((b) => (b === 'preview' ? null : b))
    }
  }, [poster, busy, name, designation, lang])

  const canShareFiles =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

  /**
   * The native share sheet, which sends the actual JPG.
   *
   * This is the only route that reaches Instagram from a web page — Instagram
   * accepts no image from a URL, so a "share to Instagram" button is not a thing
   * that can be built. The sheet hands the file to whichever app is chosen, and
   * carries the link alongside it.
   */
  const shareNative = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToJpeg(canvasRef.current, 0.92)
      const file = new File([blob], filename, { type: 'image/jpeg' })
      const text = shareMessage({ poster, name, url: shareUrl })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        return
      }
      await navigator.share({ text, url: shareUrl })
    } catch (err) {
      if (err?.name !== 'AbortError') await download()
    }
  }, [download, filename, poster, name, shareUrl])

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

  const msg = shareMessage({ poster, name, url: shareUrl })
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${poster.title}\n\n`
  )}&url=${encodeURIComponent(shareUrl)}`
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

  const busyLabel =
    busy === 'loading-model'
      ? t('Getting the background remover ready…')
      : busy === 'cutting'
        ? t('Removing the background…')
        : busy === 'generating'
          ? t('Generating your poster…')
          : null

  return (
    <>
      <Seo
        title={`Create your poster — ${poster.issue}`}
        description={`Put your name, designation and photo on the ${poster.issue} campaign poster and share it. Free, works on a phone, and the poster is made on your own device.`}
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
            <div id="poster-result" className="lg:col-span-6 xl:col-span-7">
              <div className="sticky top-[calc(var(--nav-h)+1.5rem)]">
                <div
                  className={`overflow-hidden rounded-sm border bg-white shadow-frame transition-colors ${
                    generated ? 'border-brand-500' : 'hairline'
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    className="block h-auto w-full"
                    aria-label={t('Your poster')}
                    role="img"
                  />
                </div>

                {busyLabel && (
                  <p
                    className="mt-4 flex items-center gap-3 rounded-sm bg-ink-900 px-4 py-3 text-sm text-white"
                    role="status"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    {busyLabel}
                  </p>
                )}

                {generated && !busy && (
                  <p
                    className="mt-4 flex items-center gap-2.5 rounded-sm bg-brand-500 px-4 py-3 font-sans text-sm font-semibold text-ink-900"
                    role="status"
                  >
                    <FaCircleCheck className="shrink-0" aria-hidden="true" />
                    {t('Image generated. Download or share it below.')}
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
                        'The background could not be removed on this device, so your photo is being used as it is. The poster still works — or try a photo with a plainer background.'
                      )}
                      {cutoutError && (
                        <span className="mt-1.5 block font-mono text-[0.7rem] text-ink-500">
                          {cutoutError}
                        </span>
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
                {/*
                  The form disappears once the poster exists.

                  Leaving the fields on screen beside a finished poster invites
                  somebody to change one and walk away with a download that no
                  longer matches what they are looking at. After Generate the
                  column holds the result and the ways to send it, and nothing
                  else. "Edit and generate again" brings the form back with
                  every value still in it.
                */}
                {!generated && (
                  <>
                {/* 1 — photo */}
                <div>
                  <label
                    htmlFor="poster-photo"
                    className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700"
                  >
                    {t('1. Your photograph')}
                  </label>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {t(
                      'A clear, front-facing photo from the chest up works best. The background is removed automatically, so it does not need to be plain — but good light helps.'
                    )}
                  </p>

                  <input
                    ref={fileInputRef}
                    id="poster-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline mt-4"
                    disabled={!ready || !!busy}
                  >
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
                  <label
                    htmlFor="poster-name"
                    className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700"
                  >
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
                  <label
                    htmlFor="poster-designation"
                    className="block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700"
                  >
                    {t('3. Your designation')}
                  </label>
                  <input
                    id="poster-designation"
                    type="text"
                    value={designation}
                    maxLength={54}
                    onChange={(e) => {
                      setDesignation(e.target.value)
                      invalidate()
                    }}
                    placeholder={t('e.g. iTDP Telangana State President')}
                    className="mt-3 w-full rounded-sm border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/15"
                  />
                </div>

                  </>
                )}

                {/*
                  Translated on the way to the screen, not at each setError.

                  The dictionary is keyed by the English sentence itself, so
                  every failure path can go on raising plain English — which is
                  what keeps it readable where it is written — and the lookup
                  happens once, here, where the text actually renders.
                */}
                {error && (
                  <p className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {t(error)}
                  </p>
                )}

                {/* 4 — generate, then the result */}
                <div className={generated ? '' : 'border-t hairline pt-8'}>
                  {!generated ? (
                    <>
                      <button
                        type="button"
                        onClick={generate}
                        className="btn-brand w-full justify-center sm:w-auto"
                        disabled={!canGenerate}
                      >
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
                    <div className="space-y-6">
                      <div>
                        <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                          {t('Save and share')}
                        </p>
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
                        <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                          {t('Share the link')}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">
                          {t(
                            'Anyone who opens your link sees the poster with your name on it, and can make their own in a minute.'
                          )}
                        </p>

                        {/*
                          The one place in this tool where anything leaves the
                          device, so it is a button with the consequence written
                          beside it rather than a default somebody would have to
                          notice in order to avoid.
                        */}
                        {previewOffered && !cardId ? (
                          <div className="mt-4 rounded-sm border border-ink-200 bg-ink-50 p-4">
                            <button
                              type="button"
                              onClick={enablePreview}
                              disabled={busy === 'preview'}
                              className="btn-outline"
                            >
                              <FaImage aria-hidden="true" />
                              {busy === 'preview'
                                ? t('Saving the preview…')
                                : t('Show my poster in the link preview')}
                            </button>
                            <p className="mt-3 text-xs leading-relaxed text-ink-600">
                              {t(
                                'Without this, WhatsApp and Facebook show the campaign poster next to your link. Turn it on and they show yours instead — which means uploading a small copy of the finished poster. Not your photograph, and not the full-size image. It is deleted after 30 days.'
                              )}
                            </p>
                          </div>
                        ) : cardId ? (
                          <p className="mt-4 flex items-start gap-2 rounded-sm border border-brand-500 bg-brand-50 p-4 text-xs leading-relaxed text-ink-700">
                            <FaCircleCheck className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
                            <span>
                              {t(
                                'Your poster will show in the link preview. The copy that makes that possible is deleted after 30 days.'
                              )}
                            </span>
                          </p>
                        ) : null}

                        {cardError && (
                          <p
                            className="mt-3 rounded-sm bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"
                            role="alert"
                          >
                            {cardError}{' '}
                            {t('Your poster is finished — only the link preview is affected.')}
                          </p>
                        )}

                        <div className="mt-3 flex items-stretch gap-2">
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

                        <p className="mt-4 text-xs leading-relaxed text-ink-500">
                          {t(
                            'WhatsApp, X and Facebook share the link. To send the poster image itself, use Share — your phone’s share sheet passes the picture straight to WhatsApp, Instagram or anywhere else.'
                          )}
                        </p>
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
                    'Your photograph is never uploaded. The background is removed and the poster is composed inside your browser, on your own device. The link you share carries your name and designation. If you ask for your poster to show in the link preview, a small copy of the finished poster is stored so chat apps can fetch it, and it is deleted after 30 days — your original photograph still never leaves this device, and there is no account.'
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
