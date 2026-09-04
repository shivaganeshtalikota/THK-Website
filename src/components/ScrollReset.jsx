import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll to the top on navigation.
 *
 * React Router keeps the window scroll position across route changes, so
 * clicking a footer link from the bottom of a long page used to land you
 * halfway down the next one. Hash links (#section) are left alone so in-page
 * anchors still work.
 */
const ScrollReset = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return

    // The jump must be instant, but `html { scroll-behavior: smooth }` in our
    // CSS would animate it: per CSSOM-View, behavior "auto" resolves to the
    // element's computed scroll-behavior, so scrollTo({behavior:'auto'}) and
    // the two-arg scrollTo(0,0) both animate here. "instant" does the right
    // thing in current browsers but is a newer enum value, and an unknown enum
    // member in a dictionary is a TypeError in older engines.
    // Overriding the property for the duration sidesteps both problems.
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.style.scrollBehavior = previous
  }, [pathname, hash])

  return null
}

export default ScrollReset
