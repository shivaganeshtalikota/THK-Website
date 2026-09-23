import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { FaDownload, FaShareNodes, FaWhatsapp, FaWandMagicSparkles, FaTriangleExclamation, FaCopy } from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import NotFound from './NotFound'
import { site } from '../data/site'
import { posterBySlug, posterCard } from '../data/posters'
import { buildShareUrl, readSharedId, sharedPosterSrc, shareMessage } from '../lib/posterLink'
import { useT, useLang } from '../i18n/useT'

/**
 * What somebody sees when they open a poster link a friend sent them.
 *
 * The poster itself, full size and sharp — not the campaign page with a form
 * on it. Then the three things they might want: save it, pass it on, or make
 * their own. The generator is one tap away and not on screen until they ask,
 * which is what the office wanted: the person who opened the link came to see
 * a poster, not to fill in a form.
 *
 * A separate, prerendered route (/posters/<slug>/view) rather than a mode of
 * the campaign page. The campaign page is prerendered with its form showing,
 * so switching it into a viewer in the browser would flash the form first.
 * This page's HTML is already the viewer; the browser only fills in which
 * poster from ?p=.
 */
const SharedPoster = () => {
  const { slug } = useParams()
  const { search } = useLocation()
  const t = useT()
  const lang = useLang()
  const poster = posterBySlug(slug)

  // Read after mount: the prerendered HTML has no query string, and reading it
  // during the first render would not match that HTML.
  const [id, setId] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | missing
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState(null)

  useEffect(() => {
    const found = readSharedId(search)
    setId(found)
    if (!found) setState('missing')
  }, [search])

  const shareUrl = id && poster ? buildShareUrl({ origin: window.location.origin, slug: poster.slug, id, lang }) : ''
  const filename = `${poster?.slug || 'poster'}.jpg`

  const fetchBlob = useCallback(async () => {
    const r = await fetch(sharedPosterSrc(id))
    if (!r.ok) throw new Error('missing')
    return r.blob()
  }, [id])

  const download = useCallback(async () => {
    try {
      const blob = await fetchBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setNote(t('The poster could not be downloaded. Please try again.'))
    }
  }, [fetchBlob, filename, t])

  const shareNative = useCallback(async () => {
    try {
      const blob = await fetchBlob()
      const file = new File([blob], filename, { type: 'image/jpeg' })
      const text = shareMessage({ poster, url: shareUrl })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text })
      else await navigator.share({ text, url: shareUrl })
    } catch (err) {
      if (err?.name !== 'AbortError') await download()
    }
  }, [fetchBlob, filename, poster, shareUrl, download])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setNote(t('Could not copy the link. Select and copy it by hand.'))
    }
  }, [shareUrl, t])

  if (!poster) return <NotFound />

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const waHref = shareUrl ? `https://wa.me/?text=${encodeURIComponent(shareMessage({ poster, url: shareUrl }))}` : '#'

  return (
    <>
      <Seo
        title={`${t('Poster')} — ${poster.issue}`}
        description={`${poster.titleEn}. Make your own poster with your name and photo.`}
        image={{ url: `${site.url}${posterCard(poster)}`, width: 1200, height: 630, alt: poster.titleEn }}
        noindex
      />

      <section className="section bg-ink-950 text-white">
        <div className="container-custom grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7 xl:col-span-6">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[34rem] overflow-hidden rounded-sm bg-ink-900 shadow-2xl ring-1 ring-white/10">
              {state !== 'missing' && id && (
                <img
                  src={sharedPosterSrc(id)}
                  alt={t('A poster made for this campaign')}
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
                    state === 'ready' ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setState('ready')}
                  onError={() => setState('missing')}
                  decoding="async"
                />
              )}
              {state === 'loading' && (
                <div className="absolute inset-0 grid place-items-center" role="status">
                  <span className="flex items-center gap-3 text-sm text-white/70">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-hidden="true" />
                    {t('Loading the poster…')}
                  </span>
                </div>
              )}
              {state === 'missing' && (
                <div className="absolute inset-0 grid place-items-center p-8 text-center">
                  <div>
                    <FaTriangleExclamation className="mx-auto text-2xl text-brand-400" aria-hidden="true" />
                    <p className="mt-4 text-sm leading-relaxed text-white/75">
                      {t('This poster is no longer available. Shared posters are kept for 30 days.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-6 lg:pt-6">
            <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-400">{poster.issue}</p>
            <h1 className="mt-4 font-display text-title text-white">
              {state === 'missing' ? t('Make your own poster') : t('A poster for this campaign')}
            </h1>
            <p lang="te" className="mt-4 text-lead text-white/70">
              {poster.title}
            </p>

            {state === 'ready' && (
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={download} className="btn-brand">
                  <FaDownload aria-hidden="true" />
                  {t('Download')}
                </button>
                {canShare ? (
                  <button type="button" onClick={shareNative} className="btn-ghost-light">
                    <FaShareNodes aria-hidden="true" />
                    {t('Share')}
                  </button>
                ) : (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-ghost-light">
                    <FaWhatsapp aria-hidden="true" />
                    {t('WhatsApp')}
                  </a>
                )}
                <button type="button" onClick={copy} className="btn-ghost-light">
                  <FaCopy aria-hidden="true" />
                  {copied ? t('Copied') : t('Copy link')}
                </button>
              </div>
            )}

            {note && <p className="mt-4 text-sm text-amber-300" role="alert">{note}</p>}

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="text-sm leading-relaxed text-white/70">
                {t('Put your own name and photo on this poster. It takes a minute, works on a phone, and your photo stays on your device.')}
              </p>
              <Link to={`/posters/${poster.slug}`} className="btn-brand mt-5">
                <FaWandMagicSparkles aria-hidden="true" />
                {t('Generate your own poster')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default SharedPoster
