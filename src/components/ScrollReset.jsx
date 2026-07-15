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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

export default ScrollReset
