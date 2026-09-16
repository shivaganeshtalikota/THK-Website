/**
 * The shareable link for a finished poster.
 *
 * TWO SHAPES, AND WHICH ONE YOU GET IS THE VISITOR'S CHOICE.
 *
 *   /posters/<slug>?s=<token>     the default. Name and designation only.
 *   /s/<slug>/<id>?s=<token>      after opting in. Previews as their poster.
 *
 * THIS FILE USED TO ARGUE AGAINST THE SECOND ONE, and the argument is kept
 * here rather than deleted, because it was not wrong — it was incomplete, and
 * the reasoning matters more than the conclusion.
 *
 * It said: a link carrying the photograph would mean hosting a picture of a
 * real person on the party's own domain, publicly and unmoderated, breaking a
 * promise this page makes and handing anyone a way to put an image of their
 * choosing on TDP-branded artwork. All of that is still true. What it got wrong
 * was treating it as one decision for everybody. It is not: it is a decision
 * each person can make about their own poster, and most of the risk evaporates
 * once the upload is something you ask for rather than something that happens.
 *
 * So nothing is uploaded unless the visitor presses "Show my poster in the link
 * preview". Until then the link is the first shape and the page's promise holds
 * literally. Press it, and a 1200x630 card — not the photograph, not the
 * full-size poster — is stored under an unguessable id and deleted after thirty
 * days by a storage lifecycle rule rather than by a cron somebody has to
 * remember to keep alive.
 *
 * WHY THE SECOND SHAPE IS A DIFFERENT PATH. The obvious thing is to vary the
 * preview by query string on the existing page. It cannot be done: Vercel
 * consults the filesystem before rewrites and ignores query strings in the
 * cache key for a static file, so the prerendered page wins. Fetched from
 * production as facebookexternalhit, /posters/22a-patta-bhumi and the same URL
 * with ?s= come back byte-identical, same ETag. A path with nothing static
 * behind it is the way out, and it has the pleasant side effect that every link
 * already shared keeps working.
 *
 * The poster image itself still shares directly either way — the phone's share
 * sheet sends the actual JPG to WhatsApp, Instagram or anywhere else, and that
 * path uploads nothing at all.
 */

/**
 * Base64url, UTF-8 safe.
 *
 * Plain btoa() throws on anything outside Latin-1, which is every Telugu name
 * this will ever be given. The string is encoded to UTF-8 bytes first. The
 * result is then made URL-safe: +/ become -_ and the = padding goes, so the
 * token survives being pasted into WhatsApp, an SMS, or a QR code without
 * anything escaping it.
 */
function encodeToken(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeToken(token) {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    // A mangled token is not an error worth showing anybody — the page simply
    // opens blank, which is a perfectly good state to be in.
    return null
  }
}

/**
 * Build the shareable URL for a poster somebody has just made.
 *
 * With no `cardId` this is the plain link: it opens the editor with the name
 * filled in, and nothing has been uploaded. With one, it points at the endpoint
 * that hands crawlers that person's own card — and carries the same token, so
 * whoever follows it still lands in the editor with the name already there.
 *
 * `lang` rides along because the site is bilingual and prerenders two trees;
 * without it a Telugu reader's link would send its recipients to the English
 * page, and the preview would declare the wrong og:locale.
 */
export function buildShareUrl({ origin, slug, name, designation, cardId, lang }) {
  const token = encodeToken({ n: name || '', d: designation || '' })
  if (!cardId) {
    const prefix = lang === 'te' ? '/te' : ''
    return `${origin}${prefix}/posters/${slug}?s=${token}`
  }
  return `${origin}/s/${slug}/${cardId}?s=${token}${lang === 'te' ? '&l=te' : ''}`
}

/**
 * Store the preview card, and hand back the id the share link needs.
 *
 * Sent as base64 inside JSON rather than as raw image bytes, which looks
 * wasteful and is not: Vercel's Node runtime only parses a documented set of
 * content types into a request body, and image/jpeg is not among them — posting
 * the bytes directly arrives as an empty body. The other function in this
 * project already uses the same base64-in-JSON shape for the same reason. A
 * 150KB card becomes about 200KB on the wire, against a ~4.5MB cap.
 *
 * Throws with a message fit to show somebody, because a failure here must not
 * look like the poster itself failed — the poster is finished and downloadable
 * either way, and only the link preview is affected.
 */
export async function uploadShareCard({ blob, slug }) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The preview could not be prepared.'))
    reader.readAsDataURL(blob)
  })

  const res = await fetch('/api/poster-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, image: dataUrl }),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // fall through to the status-based message
  }
  if (!res.ok || !data?.id) {
    const err = new Error(data?.error || 'The link preview could not be saved just now.')
    // Carried so the caller can tell "this site has not been set up for previews
    // yet" apart from "that did not work, try again" — the first is not the
    // visitor's problem and should not be shown to them as a failure.
    err.status = res.status
    throw err
  }
  return data.id
}

/** Read a name and designation back out of the current URL, if present. */
export function readShareToken(search) {
  const token = new URLSearchParams(search).get('s')
  if (!token) return null
  const data = decodeToken(token)
  if (!data) return null
  return { name: data.n || '', designation: data.d || '' }
}

/**
 * The message that travels with the link.
 *
 * Written to be forwarded: it says what the campaign is, who made this one, and
 * that the reader can make their own. A share text that only carries a URL gets
 * opened by nobody.
 */
export function shareMessage({ poster, name, url }) {
  const who = name ? `— ${name}` : ''
  return `${poster.title}\n${who}\n\nమీ పేరుతో మీ పోస్టర్ తయారు చేసుకోండి / Make your own poster:\n${url}`
}
