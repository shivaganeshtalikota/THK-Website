import { FaXTwitter, FaArrowRight } from 'react-icons/fa6'
import { xAccounts } from '../data/site'
import { useT } from '../i18n/useT'

/**
 * Links to the X accounts, in place of an embedded timeline.
 *
 * WHY NOT THE EMBED
 * It was an embedded timeline, and it rendered an empty frame. The cause is not
 * fixable from here: the account has essentially no posts, so X's syndication
 * endpoint returns a shell with no entries — measured at 1,017 bytes against
 * 178KB and 701KB for two large accounts checked as a control. The widget
 * itself worked, the CSP allowed it, and there was simply nothing to show.
 *
 * Shipping a box that is reliably empty is worse than not shipping one, so this
 * sends people to the accounts instead. It also drops a third-party script and
 * two framed origins from the page, which is why the CSP no longer carries the
 * twitter.com exceptions.
 *
 * It shows his account and the party's, per the office.
 */
const PostsFeed = ({ className = '' }) => {
  const t = useT()
  return (
  <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
    {xAccounts.map((a) => (
      <a
        key={a.url}
        href={a.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 border hairline bg-white p-5 transition-colors hover:border-ink-900"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-ink-900 text-base text-white transition-transform duration-300 group-hover:scale-105">
          <FaXTwitter aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-ink-900">
            {t(a.name)}
            <span className="sr-only"> {t('on X (opens in a new tab)')}</span>
          </span>
          <span className="block truncate text-sm text-ink-500">
            {a.handle} · {t(a.description)}
          </span>
        </span>
        <FaArrowRight
          className="shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700"
          aria-hidden="true"
        />
      </a>
    ))}
  </div>
  )
}

export default PostsFeed
