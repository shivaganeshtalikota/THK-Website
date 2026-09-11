import { Link, useLocation } from 'react-router-dom'
import { LANGS, LANG_LABEL, LOCALE, langFromPath, localePath } from '../i18n'

/**
 * English / తెలుగు, in the nav.
 *
 * Real links, not buttons. That is the point of the whole /te arrangement: a
 * button swapping state in place would leave Google with one URL and no way to
 * discover the Telugu pages, whereas an <a href="/te/about"> is a crawlable
 * edge from every English page to its Telugu twin. It also means the choice
 * survives a refresh, a bookmark and a shared link without any storage.
 *
 * `hrefLang` tells a crawler what it will find on the other side; `lang` on the
 * label itself stops a screen reader reading "తెలుగు" with English phonetics —
 * the one word on the page that is guaranteed to be in the other language.
 *
 * The current language is a <span>, not a link to itself: a link that goes
 * nowhere is noise for anyone tabbing through, and aria-current says which one
 * is active without needing colour to carry it.
 */
const LanguageToggle = ({ className = '', onNavigate }) => {
  const { pathname } = useLocation()
  const current = langFromPath(pathname)

  return (
    <div
      className={`inline-flex items-center rounded-sm border border-ink-900/20 p-0.5 ${className}`}
      role="group"
      aria-label="Language / భాష"
    >
      {LANGS.map((lang) => {
        const active = lang === current
        const label = LANG_LABEL[lang]
        const shared =
          'tap-round rounded-sm px-2.5 py-1.5 font-sans text-[0.72rem] font-semibold leading-none'

        if (active) {
          return (
            <span
              key={lang}
              aria-current="true"
              lang={LOCALE[lang]}
              className={`${shared} bg-ink-900 text-white`}
            >
              {label}
            </span>
          )
        }
        return (
          <Link
            key={lang}
            to={localePath(pathname, lang)}
            hrefLang={LOCALE[lang]}
            lang={LOCALE[lang]}
            onClick={onNavigate}
            className={`${shared} text-ink-900/70 hover:bg-ink-900/10 hover:text-ink-900`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

export default LanguageToggle
