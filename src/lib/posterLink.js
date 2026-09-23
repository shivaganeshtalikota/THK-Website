/**
 * Share links for finished posters.
 *
 *   /s/<slug>/<id>        a poster somebody made. Link previews show that
 *                         poster; opening it shows the poster full size, with
 *                         Download and "Make your own".
 *   /posters/<slug>       the campaign itself, when there is nothing to show
 *                         yet (or saving the poster failed).
 *
 * WHY /s/ AND NOT A QUERY STRING ON THE CAMPAIGN PAGE
 * The campaign page is a prerendered static file. Vercel serves files before
 * rewrites and ignores the query string when caching one, so crawlers would
 * get the campaign's card whatever the query said. /s/ has no file behind it,
 * so the function behind it can hand crawlers this poster's own card.
 *
 * WHAT IS STORED
 * The finished poster (full resolution, so the person opening the link sees it
 * sharp and can download it) and a 1200x630 card of it for link previews. Not
 * the photograph it was made from — that never leaves the device. Both are
 * kept under an unguessable id and deleted after thirty days.
 */

const ID = /^[A-Za-z0-9_-]{22}$/

export function buildShareUrl({ origin, slug, id, lang }) {
  if (!id) return `${origin}${lang === 'te' ? '/te' : ''}/posters/${slug}`
  return `${origin}/s/${slug}/${id}${lang === 'te' ? '?l=te' : ''}`
}

/** The full-size poster behind a share id. */
export const sharedPosterSrc = (id) => `/c/${id}-p.jpg`

/** The share id in ?p=, if it is one. */
export function readSharedId(search) {
  const id = new URLSearchParams(search).get('p')
  return id && ID.test(id) ? id : null
}

/**
 * Store a finished poster and its card; resolve to the share id.
 *
 * Sent as raw bytes — a 4-byte card length, the card, the poster — because a
 * full-resolution poster in base64 JSON would be a third larger and run into
 * Vercel's request limit. XHR rather than fetch because fetch still cannot
 * report upload progress, and a phone on 3G uploading 2MB needs to see that
 * something is happening.
 *
 * @param {{slug: string, card: Blob, poster: Blob, onProgress?: (fraction: number) => void}} o
 */
export function uploadPoster({ slug, card, poster, onProgress }) {
  return new Promise((resolve, reject) => {
    const head = new ArrayBuffer(4)
    new DataView(head).setUint32(0, card.size)
    const body = new Blob([head, card, poster], { type: 'application/octet-stream' })

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/poster-card?slug=${encodeURIComponent(slug)}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.responseType = 'json'
    xhr.timeout = 120_000
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    const failWith = (message, status) => {
      const err = new Error(message)
      err.status = status
      reject(err)
    }
    xhr.onload = () => {
      const data = xhr.response || {}
      if (xhr.status === 200 && data.id) {
        onProgress?.(1)
        resolve(data.id)
      } else {
        failWith(data.error || 'Your poster could not be saved just now.', xhr.status)
      }
    }
    xhr.onerror = () => failWith('No connection — your poster could not be saved. You can still download it.', 0)
    xhr.ontimeout = () => failWith('Saving took too long on this connection. You can still download it.', 0)
    xhr.send(body)
  })
}

/**
 * The message that travels with the link: what the campaign is, and that the
 * reader can make their own. No name — the office did not want the sender's
 * name and designation in the text of every forwarded link; the poster shows
 * them.
 */
export function shareMessage({ poster, url }) {
  return `${poster.title}\n\nమీ పేరుతో మీ పోస్టర్ తయారు చేసుకోండి / Make your own poster:\n${url}`
}
