import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaDownload,
  FaShareNodes,
  FaWhatsapp,
  FaCamera,
  FaRotate,
  FaCircleCheck,
  FaTriangleExclamation,
} from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import NotFound from './NotFound'
import { site } from '../data/site'
import { posterBySlug, posterImage } from '../data/posters'
import { loadImage, ensureFonts, renderPoster, canvasToJpeg } from '../lib/renderPoster'
import { useT } from '../i18n/useT'

/**
 * Put your name and face on a campaign poster, and share it.
 *
 * DESIGNED FOR A PHONE ON A FIELD DAY. The whole thing is one column: see the
 * poster, add a photo, type two lines, download. No account, no wizard, no step
 * that can be got wrong. Every change re-renders the same canvas the download is
 * taken from, so what somebody sees is exactly what they get — rendering the
 * preview and the export through different code is how posters go out with the
 * text in the wrong place.
 *
 * NOTHING IS UPLOADED. The photograph is read with FileReader, segmented by a
 * model running in the same tab, and drawn to a canvas. It never touches a
 * server — ours or anyone's — which is both the right default when you are
 * asking people for a picture of their own face, and the only way this is
 * affordable at campaign volume.
 */

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

const PosterStudio = () => {
  const { slug } = useParams()
  const t = useT()
  const poster = posterBySlug(slug)

  const canvasRef = useRef(null)
  const artworkRef = useRef(null)
  const personRef = useRef(null)
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(null) // null | 'loading-model' | 'cutting'
  const [cutout, setCutout] = useState('none') // none | done | failed | raw
  const [error, setError] = useState(null)
  const [downloaded, setDownloaded] = useState(false)

  /** Redraw from whatever is currently in the refs. */
  const redraw = useCallback(() => {
    if (!canvasRef.current || !artworkRef.current || !poster) return
    renderPoster({
      canvas: canvasRef.current,
      poster,
      artwork: artworkRef.current,
      person: personRef.current,
      name,
      designation,
      scale: 1,
    })
  }, [poster, name, designation])

  // Load the artwork and the fonts once, then draw the empty poster so the page
  // shows the real thing immediately rather than a spinner.
  useEffect(() => {
    if (!poster) return
    let alive = true
    ;(async () => {
      try {
        const [art] = await Promise.all([loadImage(posterImage(poster)), ensureFonts()])
        if (!alive) return
        artworkRef.current = art
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
    if (ready) redraw()
  }, [ready, redraw])

  const handleFile = useCallback(
    async (file) => {
      if (!file) return
      setError(null)
      setDownloaded(false)

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

        // Show the photo immediately, uncut. If segmentation then works the
        // preview improves; if it fails the poster is already usable. The
        // visitor is never left looking at nothing while a 3MB model downloads.
        personRef.current = img
        setCutout('raw')
        redraw()

        setBusy('loading-model')
        const { removeBackground } = await import('../lib/removeBackground')
        setBusy('cutting')
        const cut = await removeBackground(img)
        personRef.current = cut
        setCutout('done')
        redraw()
      } catch (err) {
        console.error('Background removal failed:', err)
        // Deliberately not an error state: the poster still works, so this is
        // reported as a downgrade rather than a failure.
        setCutout('failed')
      } finally {
        setBusy(null)
        URL.revokeObjectURL(url)
      }
    },
    [redraw]
  )

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
      // Revoke on the next tick; revoking synchronously can cancel the download
      // in some browsers before it has read the blob.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setDownloaded(true)
    } catch {
      setError('The poster could not be saved. Please try again.')
    }
  }, [filename])

  /**
   * Share through the device's own share sheet.
   *
   * This is the only route that reaches Instagram from a web page — Instagram
   * accepts no image from a URL, so a "share to Instagram" link is not a thing
   * that can be built. The native sheet hands the file to whichever app the
   * person picks, Instagram and WhatsApp included. Where the sheet is not
   * available the honest fallback is: save it, then share it yourself.
   */
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'

  const share = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToJpeg(canvasRef.current, 0.92)
      const file = new File([blob], filename, { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: poster.titleEn,
          text: `${poster.title}\n${site.url}/posters/${poster.slug}`,
        })
        return
      }
      await download()
    } catch (err) {
      // An AbortError just means they closed the sheet; that is not a failure.
      if (err?.name !== 'AbortError') await download()
    }
  }, [download, filename, poster])

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

  const busyLabel =
    busy === 'loading-model'
      ? t('Getting the background remover ready…')
      : busy === 'cutting'
        ? t('Removing the background…')
        : null

  return (
    <>
      <Seo
        title={`Create your poster — ${poster.issue}`}
        description={`Put your name, designation and photo on the ${poster.issue} campaign poster and share it. Free, works on a phone, and your photo never leaves your device.`}
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
            <div className="lg:col-span-6 xl:col-span-7">
              <div className="sticky top-[calc(var(--nav-h)+1.5rem)]">
                <div className="overflow-hidden rounded-sm border hairline bg-white shadow-frame">
                  <canvas
                    ref={canvasRef}
                    className="block h-auto w-full"
                    aria-label={t('Live preview of your poster')}
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

                {!busy && cutout === 'done' && (
                  <p className="mt-4 flex items-center gap-2.5 text-sm text-ink-600">
                    <FaCircleCheck className="shrink-0 text-brand-700" aria-hidden="true" />
                    {t('Background removed. Happy with it? Download below.')}
                  </p>
                )}

                {!busy && cutout === 'failed' && (
                  <p className="mt-4 flex items-start gap-2.5 rounded-sm bg-brand-500/15 px-4 py-3 text-sm text-ink-700">
                    <FaTriangleExclamation className="mt-0.5 shrink-0 text-brand-800" aria-hidden="true" />
                    <span>
                      {t(
                        'The background could not be removed on this device, so your photo is being used as it is. The poster still works — or try a photo with a plainer background.'
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
                {/* Photo */}
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
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary"
                      disabled={!ready || !!busy}
                    >
                      <FaCamera aria-hidden="true" />
                      {cutout === 'none' ? t('Choose photo') : t('Change photo')}
                    </button>
                    {cutout !== 'none' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-outline"
                        disabled={!!busy}
                      >
                        <FaRotate aria-hidden="true" />
                        {t('Try another')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
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
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('e.g. Talikota Hari Krishna')}
                    className="mt-3 w-full rounded-sm border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/15"
                  />
                  <p className="mt-2 text-xs text-ink-500">
                    {t('Telugu or English — both work.')}
                  </p>
                </div>

                {/* Designation */}
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
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder={t('e.g. iTDP Telangana State President')}
                    className="mt-3 w-full rounded-sm border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/15"
                  />
                </div>

                {error && (
                  <p className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="border-t hairline pt-8">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-700">
                    {t('4. Save and share')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={download} className="btn-brand" disabled={!ready}>
                      <FaDownload aria-hidden="true" />
                      {t('Download JPG')}
                    </button>

                    {canShareFiles && (
                      <button type="button" onClick={share} className="btn-outline" disabled={!ready}>
                        <FaShareNodes aria-hidden="true" />
                        {t('Share')}
                      </button>
                    )}

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `${poster.title}\n${site.url}/posters/${poster.slug}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline"
                    >
                      <FaWhatsapp aria-hidden="true" />
                      {t('WhatsApp')}
                    </a>
                  </div>

                  {downloaded && (
                    <p className="mt-4 flex items-center gap-2.5 text-sm text-ink-600">
                      <FaCircleCheck className="shrink-0 text-brand-700" aria-hidden="true" />
                      {t('Saved to your device. Share it from your gallery.')}
                    </p>
                  )}

                  <p className="mt-5 text-xs leading-relaxed text-ink-500">
                    {canShareFiles
                      ? t(
                          'Share opens your phone’s share sheet, which can send the poster straight to WhatsApp, Instagram or anywhere else. Instagram cannot accept an image directly from a web page, so the share sheet is the way to reach it.'
                        )
                      : t(
                          'Download the poster, then share it from your gallery. Instagram cannot accept an image directly from a web page.'
                        )}
                  </p>
                </div>

                <p className="rounded-sm bg-ink-900 px-4 py-3.5 text-xs leading-relaxed text-white/75">
                  {t(
                    'Your photograph is never uploaded. The poster is made inside your browser, on your own device, and nothing is stored anywhere.'
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
