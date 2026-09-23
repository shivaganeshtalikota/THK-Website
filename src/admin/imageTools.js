/**
 * Image preparation for the panel: photographs for the gallery, and a stand-in
 * figure for previewing poster layouts.
 */

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve(img)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be opened as an image.'))
    }
    img.src = url
  })
}

function toJpeg(canvas, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image.'))), 'image/jpeg', quality),
  )
}

function scaled(img, maxSide) {
  const s = Math.min(1, maxSide / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

export const MAX_PHOTO_BYTES = 30 * 1024 * 1024

/**
 * A gallery photograph, twice:
 *   display   up to 2000px, for the grid — sharp on any screen, light enough
 *             that a page of thumbnails loads on a phone
 *   original  the file exactly as chosen, for the full-screen viewer — only
 *             re-encoded if it is enormous (over 4800px) or not a web format
 */
export async function preparePhoto(file) {
  if (file.size > MAX_PHOTO_BYTES) throw new Error('That photo is over 30 MB. Choose a smaller one.')
  const img = await readImageFile(file)
  const display = await toJpeg(scaled(img, 2000), 0.88)
  const webReady = /^image\/(jpeg|png|webp)$/.test(file.type)
  let original = null
  if (Math.max(img.width, img.height) > 4800 || !webReady) {
    original = await toJpeg(scaled(img, 4800), 0.93)
  } else if (file.size > display.size * 1.3) {
    original = file
  }
  return { img, display, original, width: img.width, height: img.height }
}

/**
 * A neutral stand-in figure for previewing where a person will stand — head
 * and shoulders, cut at the chest like a typical supporter's photo, so the
 * preview shows how the real thing will sit on the bar.
 */
export function silhouette() {
  const W = 900
  const H = 1100
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#b9bdc2')
  grad.addColorStop(1, '#7b8086')
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(W / 2, 330, 170, 205, 0, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.moveTo(W / 2 - 95, 500)
  g.lineTo(W / 2 + 95, 500)
  g.lineTo(W / 2 + 120, 610)
  g.bezierCurveTo(W / 2 + 330, 640, W - 20, 760, W - 10, H)
  g.lineTo(10, H)
  g.bezierCurveTo(20, 760, W / 2 - 330, 640, W / 2 - 120, 610)
  g.closePath()
  g.fill()
  return { canvas: c, cut: { bottom: true, left: false, right: false, top: false } }
}
