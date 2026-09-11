import { useLocation } from 'react-router-dom'
import { langFromPath } from './index'
import { te } from './te'

/**
 * Translation, keyed by the English string itself.
 *
 * WHY KEYED BY THE SOURCE TEXT
 * The obvious alternative is symbolic keys — t('home.hero.cta'). It was
 * rejected for two reasons that matter more than tidiness here.
 *
 * First, the fallback. A missing symbolic key renders "home.hero.cta" to a
 * visitor; a missing key here renders correct English. On a site where the
 * Telugu is being added page by page and reviewed by the office before it goes
 * live, that difference is the whole safety net — a gap degrades to the
 * original sentence rather than to debug output.
 *
 * Second, review. The office has to check this Telugu against a serving
 * politician's titles, his temple's formal name and his party's wording. A
 * dictionary keyed by English is a two-column document they can read straight
 * through. A symbolic one is not reviewable by anyone who is not also reading
 * the code.
 *
 * The cost is that two different senses of one English phrase cannot diverge.
 * Nothing on this site needs that, and if it ever does the entry can move to a
 * disambiguated key.
 */
export const useLang = () => langFromPath(useLocation().pathname)

export const useT = () => {
  const lang = useLang()
  if (lang !== 'te') return (s) => s
  return (s) => (typeof s === 'string' ? (te[s] ?? s) : s)
}

/**
 * Marks a string as Telugu for the browser and for assistive technology.
 *
 * Spread onto the element that holds translated text: <p {...langAttr(lang)}>.
 * Without it the page inherits lang="en" and a screen reader pronounces Telugu
 * with English phonetics, while the font stack has no signal to switch to the
 * Telugu face.
 */
export const langAttr = (lang) => (lang === 'te' ? { lang: 'te' } : {})
