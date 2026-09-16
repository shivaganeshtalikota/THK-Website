/**
 * The shareable link for a finished poster.
 *
 * WHAT IS AND IS NOT IN IT
 * The name and the designation — and deliberately not the photograph. A link
 * that carried the photo would mean hosting a picture of a real person on the
 * party's own domain, publicly and unmoderated, which is both a promise this
 * page should not break and an obvious way for somebody to put any image they
 * like on TDP-branded artwork and pass the result off as official.
 *
 * So the link opens the poster with that person's name already filled in, and
 * invites whoever followed it to make their own. That spreads the tool rather
 * than one image, which is the better outcome for reach anyway: an image shared
 * on WhatsApp is seen, but a link that makes the next person a poster is
 * forwarded again.
 *
 * The poster image itself still shares directly — the phone's share sheet sends
 * the actual JPG to WhatsApp, Instagram or anywhere else.
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

/** Build the shareable URL for a poster somebody has just made. */
export function buildShareUrl({ origin, slug, name, designation }) {
  const token = encodeToken({ n: name || '', d: designation || '' })
  return `${origin}/posters/${slug}?s=${token}`
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
