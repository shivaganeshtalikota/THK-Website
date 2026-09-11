/**
 * Language, derived from the URL.
 *
 * WHY THE URL AND NOT A TOGGLE IN STATE
 * The office wanted Telugu reachable by search, not just by a button. A
 * client-side toggle over one URL gives Google exactly one page to index, so
 * a Telugu search for "తాళికోట హరికృష్ణ" can never find him — and serving
 * different text at the same URL depending on hidden state is the shape of
 * cloaking, which is worth avoiding on a politician's site.
 *
 * So Telugu lives at its own paths: /te, /te/about, /te/political and so on.
 * Sixteen indexable pages instead of eight, each declaring the other as its
 * hreflang alternate. The nav toggle is then just a link that swaps the prefix
 * and keeps you on the same page.
 *
 * Nothing here needs React. Language is a pure function of the pathname, which
 * means it is identical on the server during prerender and in the browser after
 * hydration — no provider, no state, and no chance of the two disagreeing.
 */
export const LANGS = ['en', 'te']
export const DEFAULT_LANG = 'en'
export const PREFIX = '/te'

/** BCP 47 tags, used for <html lang>, hreflang and og:locale. */
export const LOCALE = { en: 'en-IN', te: 'te-IN' }
export const OG_LOCALE = { en: 'en_IN', te: 'te_IN' }

/** What the toggle itself says, in each language's own script. */
export const LANG_LABEL = { en: 'English', te: 'తెలుగు' }

export const langFromPath = (pathname = '/') =>
  pathname === PREFIX || pathname.startsWith(`${PREFIX}/`) ? 'te' : 'en'

/** The path with any language prefix removed — always the English path. */
export const stripLang = (pathname = '/') => {
  if (pathname === PREFIX) return '/'
  if (pathname.startsWith(`${PREFIX}/`)) return pathname.slice(PREFIX.length) || '/'
  return pathname
}

/** The same page in the given language. */
export const localePath = (pathname = '/', lang = DEFAULT_LANG) => {
  const base = stripLang(pathname)
  if (lang !== 'te') return base
  return base === '/' ? PREFIX : `${PREFIX}${base}`
}
