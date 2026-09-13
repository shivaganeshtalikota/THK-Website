/**
 * Where the Telugu dictionary lives once something has loaded it.
 *
 * This module exists so that nothing on the English path has to import te.js.
 * It is deliberately tiny and dependency-free: both entries import it, and
 * Rollup keeps it in the main chunk while the 68 KB dictionary itself goes to a
 * chunk only Telugu readers ever fetch.
 *
 * `get()` returning null is a normal state, not an error — it means English,
 * or a Telugu page whose dictionary has not arrived yet. useT treats a missing
 * dictionary the same way it treats a missing key: it returns the English
 * string. A gap degrades to the original sentence, never to blank text.
 */
let dictionary = null

export const setTelugu = (d) => {
  dictionary = d
}

export const getTelugu = () => dictionary
