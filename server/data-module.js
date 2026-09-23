/**
 * The on-disk format shared by every machine-written data file.
 *
 * A JS module whose body is `export default` followed by plain JSON. It is the
 * one shape that loads everywhere these files are read: Vite and the browser
 * bundle, the prerender, ESLint, and the serverless functions — which run in
 * plain Node, where a bare JSON import crashes the function on load (that
 * crash once took every personalised share link down; see
 * server/campaign-manifest.js). And because JSON is a JavaScript expression,
 * the file stays trivially machine-writable.
 *
 * Every reader and writer goes through these two functions, so the format is
 * defined once.
 */

/** Object -> file text, under a header comment explaining what wrote it. */
export function serializeDataModule(value, header) {
  return `${header.trimEnd()}\nexport default ${JSON.stringify(value, null, 2)}\n`
}

/**
 * File text -> object. Throws on anything that is not the format.
 *
 * Matched at the START OF A LINE: a header comment that mentions the export
 * by name would otherwise be found first and prose parsed as JSON.
 */
export function parseDataModule(text) {
  const m = /^export default\s+/m.exec(String(text))
  if (!m) throw new Error('data module has no default export')
  let body = String(text).slice(m.index + m[0].length).trim()
  if (body.endsWith(';')) body = body.slice(0, -1)
  return JSON.parse(body)
}
