/**
 * Cuts a person out of their photograph, entirely in the browser.
 *
 * WHY IN THE BROWSER
 * Every hosted background-removal API charges per image. This is meant to be
 * used by thousands of party workers on a campaign day, so per-image pricing was
 * never going to work, and shipping the photographs of thousands of people to a
 * third-party service would be a poor thing to do regardless. Nothing here
 * leaves the device.
 *
 * WHAT IT USES
 * MediaPipe Tasks Vision's ImageSegmenter with Google's selfie_segmenter model.
 * Apache-2.0, so there is no licence question about using it on a party's site
 * — which is why @imgly/background-removal was rejected despite being the more
 * obvious package: its terms around commercial use are not clear enough to bet
 * a political campaign on, and its model is around 40MB, which is unusable on
 * the mobile networks this audience is actually on.
 *
 * THE COST, STATED HONESTLY
 * The runtime is ~3MB over the wire even compressed, plus a 244KB model. That is
 * a lot. Three things make it acceptable:
 *   1. It is loaded ONLY when somebody asks for background removal — never on
 *      page load, and never for a visitor who just wants to read the page.
 *   2. It is served from our own origin with a one-year immutable cache, so it
 *      is paid once per device rather than once per poster.
 *   3. The poster works completely without it. If this fails, or the device
 *      cannot run it, the photo is simply used as-is. The feature degrades; it
 *      does not break.
 *
 * CSP
 * Compiling WebAssembly requires 'wasm-unsafe-eval' in script-src, and the
 * runtime starts a worker from a blob: URL, which requires worker-src. Both are
 * declared in vercel.json. Note that 'wasm-unsafe-eval' does NOT permit eval()
 * or new Function() — that is 'unsafe-eval', which this site still refuses.
 */

const WASM_BASE = '/vision'
const MODEL = '/vision/selfie_segmenter.tflite'

let segmenterPromise = null

/** Load the runtime and model once per page, and share it between calls. */
async function getSegmenter() {
  if (segmenterPromise) return segmenterPromise

  segmenterPromise = (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
    // Our own /public, not the jsDelivr path the docs suggest: the site's CSP
    // is default-src 'self', so a CDN fetch would simply be blocked.
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    })
  })().catch((err) => {
    // Let the next attempt retry rather than caching a rejected promise for the
    // life of the page — a failure here is usually a flaky download, not a
    // permanent condition.
    segmenterPromise = null
    throw err
  })

  return segmenterPromise
}

/**
 * Soften the mask edge.
 *
 * A category mask is binary, so compositing it straight gives a hard, jagged
 * outline that reads as a bad cut-out — especially through hair. Blurring the
 * alpha channel alone feathers the boundary without touching the colour, which
 * is what makes it sit on the artwork convincingly.
 */
function featherAlpha(ctx, w, h, radius) {
  if (!radius) return
  const snapshot = ctx.getImageData(0, 0, w, h)
  ctx.save()
  ctx.filter = `blur(${radius}px)`
  ctx.globalCompositeOperation = 'copy'
  const tmp = document.createElement('canvas')
  tmp.width = w
  tmp.height = h
  tmp.getContext('2d').putImageData(snapshot, 0, 0)
  ctx.drawImage(tmp, 0, 0)
  ctx.restore()
}

/**
 * Trim fully-transparent margins so the subject fills the poster slot.
 *
 * Phone photos are mostly background. Without this the person is scaled to fit a
 * frame that is nine-tenths empty air, and lands in the poster the size of a
 * postage stamp. Cropping to the actual subject is what makes the composite look
 * deliberate.
 */
function cropToSubject(canvas, padRatio = 0.02) {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const { data } = ctx.getImageData(0, 0, w, h)

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  // Alpha over 24 rather than over 0: the feather leaves a wide skirt of
  // near-zero alpha that would defeat the crop entirely.
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return canvas // nothing detected; hand back what we were given

  const padX = Math.round((maxX - minX) * padRatio)
  const padY = Math.round((maxY - minY) * padRatio)
  const sx = Math.max(0, minX - padX)
  const sy = Math.max(0, minY - padY)
  const sw = Math.min(w - sx, maxX - minX + padX * 2)
  const sh = Math.min(h - sy, maxY - minY + padY * 2)

  const out = document.createElement('canvas')
  out.width = sw
  out.height = sh
  out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
  return out
}

/**
 * Remove the background from a loaded image.
 *
 * @param {HTMLImageElement} img
 * @returns {Promise<HTMLImageElement>} the cut-out, as a loaded image with alpha
 */
export async function removeBackground(img) {
  const segmenter = await getSegmenter()

  // Work at a bounded size. The model does not benefit from a 12-megapixel
  // input, and a phone browser will run out of memory decoding one.
  const MAX = 1400
  const scale = Math.min(1, MAX / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const work = document.createElement('canvas')
  work.width = w
  work.height = h
  const wctx = work.getContext('2d', { willReadFrequently: true })
  wctx.drawImage(img, 0, 0, w, h)

  const result = segmenter.segment(work)
  const mask = result.categoryMask
  if (!mask) {
    result.close?.()
    throw new Error('Segmentation returned no mask.')
  }

  /*
   * THE MASK IS NOT THE SIZE OF THE CANVAS.
   *
   * This is the bug that produced two earlier wrong fixes. getAsUint8Array()
   * hands back the mask at the MODEL's own resolution — 256x256 for the selfie
   * segmenter — not at the size of the image that was fed in. Indexing it as
   * `y * canvasWidth + x` therefore reads across rows at the wrong stride, and
   * what comes back is not a mask of anything. The composite looked "inverted",
   * which sent two rounds of work chasing label polarity when the labels were
   * never being read from the right place.
   *
   * So the mask is addressed in its own coordinate space and sampled with
   * nearest-neighbour as the frame is walked.
   */
  const maskData = mask.getAsUint8Array()
  const mw = mask.width || w
  const mh = mask.height || h
  const frame = wctx.getImageData(0, 0, w, h)
  const px = frame.data

  const labelAt = (x, y) => {
    const mx = Math.min(mw - 1, Math.floor((x / w) * mw))
    const my = Math.min(mh - 1, Math.floor((y / h) * mh))
    return maskData[my * mw + mx]
  }

  /*
   * WHICH LABEL IS THE PERSON? Take it from the centre of the frame.
   *
   * Not from the border: a profile photograph is usually a tight
   * head-and-shoulders crop whose subject runs off the edges, so the border is
   * the person as often as it is the background. The centre of a portrait is
   * the subject essentially always, and reading it from the image rather than
   * hardcoding the model's convention means a future model revision cannot
   * silently invert every poster.
   */
  const centre = new Map()
  for (let y = Math.floor(h * 0.25); y < Math.ceil(h * 0.65); y += 2) {
    for (let x = Math.floor(w * 0.38); x < Math.ceil(w * 0.62); x += 2) {
      const v = labelAt(x, y)
      centre.set(v, (centre.get(v) || 0) + 1)
    }
  }
  let personLabel = 0
  let best = -1
  centre.forEach((count, label) => {
    if (count > best) {
      best = count
      personLabel = label
    }
  })

  /*
   * Alpha only. Zeroing the colour channels as well leaves a dark halo once the
   * edge is feathered, because the blur pulls black in from the cleared pixels.
   */
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (labelAt(x, y) !== personLabel) px[(y * w + x) * 4 + 3] = 0
    }
  }

  wctx.putImageData(frame, 0, 0)
  mask.close?.()
  result.close?.()

  featherAlpha(wctx, w, h, Math.max(1, Math.round(Math.min(w, h) * 0.004)))

  const cropped = cropToSubject(work)

  const out = new Image()
  out.src = cropped.toDataURL('image/png')
  await out.decode()
  return out
}

/** Warm the runtime without segmenting anything, so the first real click is
 *  quick. Safe to call and ignore. */
export function prewarm() {
  getSegmenter().catch(() => {})
}
