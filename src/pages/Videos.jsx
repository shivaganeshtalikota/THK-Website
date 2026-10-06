import { FaArrowRight } from 'react-icons/fa6'
import Seo from '../components/Seo'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import VideoCard from '../components/VideoCard'
import { site } from '../data/site'
import { allVideos, channel, interviewVideos, videoPath, videos } from '../data/videos'
import { useT, useLang } from '../i18n/useT'

/**
 * Every video, each linking to its own watch page.
 *
 * Deliberately NOT a page of VideoObjects. A list of videos is not a watch
 * page, and describing each one here as well is exactly what Search Console
 * flagged ("Video isn't on a watch page"). The structured data is an ItemList
 * of the watch pages; each video is described once, on its own page.
 */
const Videos = () => {
  const t = useT()
  const lang = useLang()
  const prefix = lang === 'te' ? '/te' : ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${site.name} — videos`,
    about: { '@id': `${site.url}/#person` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: allVideos.map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${site.url}${prefix}${videoPath(v)}`,
        name: lang === 'te' ? v.titleTe : v.title,
      })),
    },
  }

  return (
    <>
      <Seo
        title="Videos — Interviews and Coverage"
        description="Videos of Talikota Hari Krishna: TV interviews and news reports, the Kanaka Durga temple board oath, the temple’s Bonalu saree offering, Mahanadu and party events."
        schema={schema}
      />
      <PageHero
        eyebrow="Videos"
        title="Videos"
        lead="Interviews on Telugu news channels, and video of his temple service and party work. Each video has its own page."
      />

      <section className="section bg-ink-950">
        <div className="on-dark container-custom">
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('On camera')}</p>
              <h2 className="mt-5 font-display text-display text-white">{t('Interviews & news reports')}</h2>
            </div>
            <p className="text-white/70 lg:col-span-7">{t('Interviews and television coverage on Telugu news channels.')}</p>
          </Reveal>
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {interviewVideos.map((v) => (
              <li key={v.id}>
                <VideoCard video={v} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-custom">
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow">{t('Video coverage')}</p>
              <h2 className="mt-5 font-display text-display">{t('From Team Haranna')}</h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-ink-600">{t('Team Haranna is a supporter-run channel, not operated by the office.')}</p>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 inline-flex items-center gap-3 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-900"
              >
                {channel.handle}
                <span className="sr-only"> {t('on YouTube (opens in a new tab)')}</span>
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <li key={v.id}>
                <VideoCard video={v} tone="light" showChannel={false} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

export default Videos
