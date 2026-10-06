import { FaPlay } from 'react-icons/fa6'
import Link from './LocaleLink'
import { CHANNELS, formatLength, formatVideoDate, videoPath, videoThumb } from '../data/videos'
import { useT, useLang } from '../i18n/useT'

/**
 * One video in a grid: thumbnail, length, what and whose it is, and the
 * title — linking to the video's own watch page on this site (not straight to
 * YouTube), which is the page search engines index the video from.
 */
export default function VideoCard({ video: v, tone = 'dark', showChannel = true }) {
  const t = useT()
  const lang = useLang()
  const dark = tone === 'dark'
  const ch = CHANNELS[v.channel]
  const title = lang === 'te' ? v.titleTe : v.title
  return (
    <Link to={videoPath(v)} className="group block">
      <span className={`relative block overflow-hidden ${dark ? 'bg-ink-800' : 'bg-ink-100'}`}>
        <img
          src={videoThumb(v)}
          alt={`${title} — ${t('video')}`}
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
          className="aspect-video w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span className="absolute inset-0 grid place-items-center bg-ink-950/20 transition-colors group-hover:bg-ink-950/5" aria-hidden="true">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-ink-900 transition-transform duration-300 group-hover:scale-110">
            <FaPlay className="ml-0.5" />
          </span>
        </span>
        <span className="absolute bottom-2 right-2 rounded-sm bg-ink-950/85 px-1.5 py-0.5 font-sans text-[0.7rem] font-semibold tabular-nums text-white" aria-hidden="true">
          {formatLength(v.seconds)}
        </span>
      </span>
      <span className={`mt-3 block font-sans text-micro uppercase ${dark ? 'text-brand-400' : 'text-brand-800'}`}>
        {t(v.kind)}
        {showChannel && ` · ${lang === 'te' ? ch.nameTe : ch.name}`} · {formatVideoDate(v.uploadDate, lang)}
      </span>
      <span
        lang={lang === 'te' ? 'te' : undefined}
        className={`mt-2 block text-sm font-semibold leading-snug transition-colors ${dark ? 'text-white group-hover:text-brand-300' : 'text-ink-900 group-hover:text-brand-800'}`}
      >
        {title}
      </span>
    </Link>
  )
}
