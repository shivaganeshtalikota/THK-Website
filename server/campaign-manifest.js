/**
 * The on-disk format of the published-campaigns manifest.
 *
 * WHY A JS MODULE AND NOT JSON
 * It was JSON, imported from src/data/posters.js. Vite accepts a bare JSON
 * import for the browser bundle, so the site built and the pages worked — but
 * the serverless functions that validate posters (api/share.js and
 * api/poster-card.js) run in plain Node, which refuses a JSON import without an
 * `with { type: 'json' }` attribute. Both functions failed to load, so every
 * personalised share link returned 500 to people and crawlers alike.
 *
 * The attribute cannot be added instead: ESLint 8 cannot parse it, and the older
 * `assert` form was removed from Node. A module whose body is `export default`
 * followed by JSON is valid everywhere this file is read — Node, Vite, ESLint —
 * and stays trivially machine-writable, because JSON is a JavaScript expression.
 *
 * Everything that reads or writes the manifest goes through these two functions,
 * so the format is defined in exactly one place.
 */

export const MANIFEST_PATH = 'src/data/campaign-posters.js'

const HEADER = `/**
 * Campaign posters published from the admin panel.
 *
 * WRITTEN BY api/publish-poster.js — do not edit by hand. Everything after
 * \`export default\` must stay plain JSON: it is parsed back as JSON when the
 * next poster is published. See server/campaign-manifest.js.
 */
export default `

/** Manifest object -> file text. */
export function serializeManifest(manifest) {
  return `${HEADER}${JSON.stringify(manifest, null, 2)}\n`
}

/**
 * File text -> manifest object. Throws on anything that is not the format.
 *
 * Matched at the START OF A LINE, not by a plain search. The header comment
 * mentions the export by name, and a first attempt that simply searched for the
 * phrase found it inside the comment and tried to parse prose as JSON — which
 * would have broken publishing the first time anyone used it.
 */
export function parseManifest(text) {
  const m = /^export default\s+/m.exec(String(text))
  if (!m) throw new Error('campaign manifest has no default export')
  let body = String(text).slice(m.index + m[0].length).trim()
  if (body.endsWith(';')) body = body.slice(0, -1)
  const parsed = JSON.parse(body)
  if (!parsed || !Array.isArray(parsed.posters)) {
    throw new Error('campaign manifest is missing its posters list')
  }
  return parsed
}
