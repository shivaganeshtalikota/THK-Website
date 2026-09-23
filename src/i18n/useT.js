import { useLocation } from 'react-router-dom'
import { langFromPath } from './index'
import { getTelugu } from './te-store'
import siteContent from '../data/site-content.js'

/**
 * Page-text edits made in the admin panel, keyed by the same English source
 * sentence the dictionary uses: { "<English>": { en?: "...", te?: "..." } }.
 * An edit wins over the original English and over the Telugu translation; a
 * language the office did not edit falls through to what was there before.
 * They ship in the bundle and in the prerendered HTML alike, so an edit is
 * real page text, not something swapped in after load.
 */
const overrides = siteContent?.text || {}

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
  if (lang !== 'te') return (s) => (typeof s === 'string' ? (overrides[s]?.en ?? s) : s)
  // Read at call time, not at module scope: on a Telugu page the dictionary is
  // awaited before hydration (see src/main.jsx), and reading it here means this
  // hook does not close over a null captured at import time.
  const dictionary = getTelugu()
  return (s) => (typeof s === 'string' ? (overrides[s]?.te ?? dictionary?.[s] ?? s) : s)
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
