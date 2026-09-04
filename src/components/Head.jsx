import { createContext, useContext, useEffect } from 'react'

/**
 * Minimal head manager, replacing react-helmet-async.
 *
 * WHY IT WAS REPLACED
 * react-helmet-async rendered the correct head during prerender but never
 * updated it again on the client: navigating between routes left the title,
 * canonical, description and the whole Open Graph block frozen on whatever the
 * entry page had. That is a wrong <title> in the tab and history for every
 * page a visitor navigates to, and a stale canonical for any crawler that
 * executes JavaScript. The library is also unmaintained and has known issues
 * with React 18 StrictMode's double-mount.
 *
 * This does exactly what the site needs and nothing else:
 *  - on the client, an effect syncs document.title and upserts the tags,
 *    keyed so each route replaces the previous route's tags rather than
 *    appending to them
 *  - during prerender, the same call records its tags on a collector that
 *    scripts/prerender.js serialises into the static HTML
 *
 * Every managed element carries data-head="1" so it can be found and replaced
 * without touching the hand-written tags in index.html.
 */

const HeadContext = createContext(null)

/** Wraps the tree during prerender so useHead can record instead of apply. */
export const HeadCollector = ({ collector, children }) => (
  <HeadContext.Provider value={collector}>{children}</HeadContext.Provider>
)

// Deliberately excludes <title>. `document.title = x` updates the existing
// element, so if the sweep removed it first the page would end up with no
// title at all — which is exactly what happened: the tab went blank.
const MANAGED = '[data-head="1"]:not(title)'

function upsert(tag) {
  const { _tag, _text, ...attrs } = tag
  const el = document.createElement(_tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v))
  }
  if (_text != null) el.textContent = _text
  el.setAttribute('data-head', '1')
  document.head.appendChild(el)
}

export function useHead({ title, tags }) {
  // Prerender path: record and return. There is no document here.
  const collector = useContext(HeadContext)
  if (collector) {
    collector.title = title
    collector.tags = tags
  }

  useEffect(() => {
    // Replace wholesale rather than diffing: the set is small, and this
    // guarantees a route never inherits a stale tag from the previous one.
    document.head.querySelectorAll(MANAGED).forEach((el) => el.remove())
    tags.forEach(upsert)
    // Title last, and via the property so the prerendered <title> element is
    // reused rather than duplicated.
    if (title) document.title = title
  }, [title, tags])
}

export default useHead
