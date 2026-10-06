import { useParams } from 'react-router-dom'
import { FaArrowRight, FaYoutube } from 'react-icons/fa6'
import Link from '../components/LocaleLink'
import Seo from '../components/Seo'
import Reveal from '../components/Reveal'
import VideoCard from '../components/VideoCard'
import NotFound from './NotFound'
import { site } from '../data/site'
import {
  allVideos,
  CHANNELS,
  formatLength,
  formatVideoDate,
  isoDuration,
  videoBySlug,
  videoEmbed,
  videoImage,
  videoPath,
  videoThumb,
  videoWatchUrl,
} from '../data/videos'
import { useT, useLang } from '../i18n/useT'

/**
 * A watch page: one video, and the page is about that video.
 *
 * This is the page Google indexes a video from. Its rules (Search Central,
 * "Video SEO best practices"): the video is the main content, it is visible
 * without scrolling or clicking, and it is described by a VideoObject on this
 * page and on no other. So the player leads the page — loaded with the page,
 * not behind a click — and only this page carries the structured data.
 */
const VideoWatch = () => {
  const { slug } = useParams()
  const t = useT()
  const lang = useLang()
  const v = videoBySlug(slug)
  if (!v) return <NotFound />

  const ch = CHANNELS[v.channel]
  const te = lang === 'te'
  const title = te ? v.titleTe : v.title
  const description = te ? v.descriptionTe : v.description
  const url = `${site.url}${te ? '/te' : ''}${videoPath(v)}`
  const youtubeEmbed = `https://www.youtube.com/embed/${v.id}`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${url}#video`,
    name: title,
    description,
    thumbnailUrl: [`${site.url}${videoImage(v)}`, `${site.url}${videoThumb(v)}`],
    uploadDate: v.uploadDate,
    duration: isoDuration(v.seconds),
    embedUrl: youtubeEmbed,
    url,
    mainEntityOfPage: url,
    sameAs: videoWatchUrl(v),
    inLanguage: 'te',
    isFamilyFriendly: true,
    author: { '@type': 'Organization', name: ch.name, url: ch.url },
    // An interview is about him; a channel's greeting or rally video is not
    // necessarily, so it only mentions him.
    [v.group === 'interview' ? 'about' : 'mentions']: { '@id': `${site.url}/#person` },
  }

  // More from the same group first, then the rest, newest first.
  const more = [
    ...allVideos.filter((x) => x.group === v.group && x.id !== v.id),
    ...allVideos.filter((x) => x.group !== v.group),
  ].slice(0, 6)

  return (
    <>
      <Seo
        title={title}
        description={description}
        type="video.other"
        image={{ url: `${site.url}${videoImage(v)}`, width: v.id === 'V1-aY34PF0A' ? 640 : 1280, height: v.id === 'V1-aY34PF0A' ? 360 : 720, type: 'image/jpeg', alt: title }}
        video={{ embedUrl: youtubeEmbed, width: v.vertical ? 405 : 1280, height: 720 }}
        crumbs={[{ name: 'Videos', path: '/videos' }]}
        schema={schema}
      />

      <section className="bg-ink-950 text-white">
        <div className="container-custom py-8 lg:py-12">
          <nav aria-label={t('Breadcrumb')} className="font-sans text-xs text-white/55">
            <Link to="/" className="hover:text-white">
              {t('Home')}
            </Link>
            <span className="px-2" aria-hidden="true">
              /
            </span>
            <Link to="/videos" className="hover:text-white">
              {t('Videos')}
            </Link>
          </nav>

          <div className={`mt-6 grid gap-8 lg:gap-12 ${v.vertical ? 'lg:grid-cols-12 lg:items-start' : 'lg:grid-cols-12'}`}>
            {/* The player: in the page from the start, never behind a click. */}
            <div className={v.vertical ? 'lg:col-span-5' : 'lg:col-span-8'}>
              <div
                className={`relative mx-auto w-full overflow-hidden rounded-sm bg-black shadow-2xl ring-1 ring-white/10 ${
                  v.vertical ? 'aspect-[9/16] max-w-[21rem]' : 'aspect-video'
                }`}
              >
                <iframe
                  src={videoEmbed(v)}
                  title={title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div className={v.vertical ? 'lg:col-span-7' : 'lg:col-span-4'}>
              <p className="font-sans text-micro uppercase text-brand-400">
                {t(v.kind)} · {te ? ch.nameTe : ch.name}
              </p>
              <h1
                lang={te ? 'te' : undefined}
                className="mt-4 font-display text-[clamp(1.6rem,1.1rem+1.6vw,2.5rem)] font-bold leading-tight tracking-[-0.01em] text-white"
              >
                {title}
              </h1>
              {!te && (
                <p lang="te" className="mt-3 text-white/70">
                  {v.titleTe}
                </p>
              )}
              <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-white/10 py-4 text-sm">
                <div>
                  <dt className="font-sans text-micro uppercase text-white/45">{t('Published')}</dt>
                  <dd className="mt-1 text-white/85">
                    <time dateTime={v.uploadDate}>{formatVideoDate(v.uploadDate, lang)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-micro uppercase text-white/45">{t('Length')}</dt>
                  <dd className="mt-1 tabular-nums text-white/85">{formatLength(v.seconds)}</dd>
                </div>
                <div>
                  <dt className="font-sans text-micro uppercase text-white/45">{t('Channel')}</dt>
                  <dd className="mt-1 text-white/85">{te ? ch.nameTe : ch.name}</dd>
                </div>
              </dl>
              <p lang={te ? 'te' : undefined} className="mt-5 leading-relaxed text-white/80">
                {description}
              </p>
              {v.channel === 'haranna' && (
                <p className="mt-4 text-xs leading-relaxed text-white/50">
                  {t('Team Haranna is a supporter-run channel, not operated by the office.')}
                </p>
              )}
              <a
                href={videoWatchUrl(v)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-brand-400 hover:text-brand-300"
              >
                <FaYoutube className="text-base" aria-hidden="true" /> {t('Watch on YouTube')}
                <span className="sr-only"> {t('(opens in a new tab)')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-title">{t('More videos')}</h2>
            <Link to="/videos" className="group inline-flex items-center gap-3 py-1.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900">
              {t('All videos')}
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
            </Link>
          </Reveal>
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((x) => (
              <li key={x.id}>
                <VideoCard video={x} tone="light" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

export default VideoWatch
