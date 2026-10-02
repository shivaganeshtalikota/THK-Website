import { api, uploadBlob } from './api'

/**
 * Gemini in the console: read an image or translate a field, and hand the
 * answer to the form. Nothing here saves anything — see server/ai.js.
 */

/**
 * A copy of the image just big enough to read. Newspaper print needs more
 * pixels than a photograph does; neither needs the 30 MB original, and a
 * smaller upload is a faster button.
 */
async function forReading(source, maxEdge) {
  const img = source instanceof Blob ? await createImageBitmap(source) : source
  const w = img.width || img.naturalWidth
  const h = img.height || img.naturalHeight
  const k = Math.min(1, maxEdge / Math.max(w, h))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * k))
  c.height = Math.max(1, Math.round(h * k))
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('The image could not be prepared.'))), 'image/jpeg', 0.86),
  )
}

/**
 * Read an image for a task: 'poster' | 'photo' | 'cutting' | 'event'.
 * `source` is a Blob/File, an image or a canvas. Resolves to the fields.
 */
export async function aiRead(task, source, extra = {}) {
  const blob = await forReading(source, task === 'cutting' ? 2400 : 1600)
  const image = await uploadBlob(blob)
  const { fields } = await api('ai-read', { task, image, ...extra })
  return fields
}

/** Read pasted text for a task (an invitation, say). */
export async function aiReadText(task, text, extra = {}) {
  const { fields } = await api('ai-read', { task, text, ...extra })
  return fields
}

/** English <-> Telugu. */
export async function aiTranslate(text, to, kind = 'text') {
  const { text: out } = await api('ai-translate', { text, to, kind })
  return out
}
