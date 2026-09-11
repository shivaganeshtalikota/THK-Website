import { forwardRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { langFromPath, localePath } from '../i18n'

/**
 * <Link>, but it keeps you in the language you are reading.
 *
 * THE PROBLEM THIS SOLVES
 * Language lives in the URL, so a plain <Link to="/about"> on a Telugu page
 * navigates to the ENGLISH About page. The visitor picked Telugu in the nav and
 * the site drops them back into English on the next click — which is worse than
 * having no Telugu at all, because it looks broken rather than unfinished.
 *
 * Rather than remembering to write the prefix at forty call sites, every
 * internal link goes through here and the prefix is applied once, from the
 * route the visitor is currently on. A page never has to know what language it
 * is rendering.
 *
 * Absolute URLs, mail/tel links and in-page anchors pass through untouched —
 * prefixing those would break them.
 */
const shouldLocalise = (to) =>
  typeof to === 'string' && to.startsWith('/') && !to.startsWith('//')

const useLocalised = (to) => {
  const { pathname } = useLocation()
  if (!shouldLocalise(to)) return to
  const lang = langFromPath(pathname)
  if (lang === 'en') return to
  // Split any #hash or ?query off before prefixing, then put it back.
  const [path, ...rest] = to.split(/(?=[?#])/)
  return localePath(path, lang) + rest.join('')
}

const LocaleLink = forwardRef(({ to, ...rest }, ref) => (
  <Link ref={ref} to={useLocalised(to)} {...rest} />
))
LocaleLink.displayName = 'LocaleLink'

export const LocaleNavLink = forwardRef(({ to, ...rest }, ref) => (
  <NavLink ref={ref} to={useLocalised(to)} {...rest} />
))
LocaleNavLink.displayName = 'LocaleNavLink'

export default LocaleLink
