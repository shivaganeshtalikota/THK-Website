/**
 * Cuts a person out of their photograph, entirely in the browser.
 *
 * WHY IN THE BROWSER
 * Every hosted background-removal API bills per image. This is meant for a
 * campaign day with thousands of party workers, so per-image pricing was never
 * going to work — and shipping photographs of thousands of people to a
 * third-party service would be a poor thing to do regardless. Nothing here
 * leaves the device.
 *
 * WHAT IT USES
 * MediaPipe Tasks Vision's ImageSegmenter with Google's selfie_segmenter model,
 * Apache-2.0. @imgly/background-removal was rejected on two independent
 * grounds: it is AGPL-3.0, which would require open-sourcing this whole site,
 * and its model is ~40MB, unusable on the networks this audience is on.
 *
 * RESOLUTION — the thing that makes or breaks the result.
 * The model emits a 256x256 mask whatever it is given. The naive pipeline is to
 * shrink the photo, mask the shrunken copy, and scale that up into the poster —
 * which stacks two separate quality losses and produces exactly the pixelated
 * cut-out this used to ship.
 *
 * So the two are separated. Segmentation runs on a small copy, because the
 * model down-samples to 256 regardless and a 12-megapixel input buys nothing.
 * The mask is then applied to the FULL-RESOLUTION original, sampled bilinearly
 * so the edge is a smooth ramp rather than a staircase of 256-grid blocks. The
 * cut-out is then only ever as soft as the photograph it came from.
 */

const WASM_BASE = '/vision'
const MODEL = '/vision/selfie_segmenter.tflite'

/** Segmentation input size. The model works at 256; a little headroom helps the
 *  mask edge and costs nothing meaningful. */
const SEG_SIZE = 512

/** Ceiling for the cut-out handed back. The poster slot is ~780x1030 at full
 *  artwork resolution, so 1600 leaves room to crop in without upscaling. */
const OUT_MAX = 1600

let segmenterPromise = null

async function getSegmenter() {
  if (segmenterPromise) return segmenterPromise

  segmenterPromise = (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
    // Our own /public, not the CDN path the docs suggest: this site's CSP is
    // default-src 'self', so a CDN fetch would simply be blocked.
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)

    const build = (delegate) =>
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      })

    /*
     * GPU first, CPU if that throws. The GPU delegate needs a working WebGL2
     * context and plenty of real devices do not have one — acceleration off, a
     * blocklisted driver, a locked-down work phone. On those the CPU path works
     * and the visitor waits a second or two longer.
     */
    try {
      return await build('GPU')
    } catch (gpuErr) {
      console.warn('GPU segmentation unavailable, falling back to CPU:', gpuErr)
      return build('CPU')
    }
  })().catch((err) => {
    // Do not cache a rejected promise for the life of the page; a failure here
    // is usually a flaky download rather than a permanent condition.
    segmenterPromise = null
    throw err
  })

  return segmenterPromise
}

/**
 * Which label is the person?
 *
 * Read from the centre of the frame rather than hardcoded. Two earlier versions
 * got this wrong instructively: the documented "0 is background" is the wrong
 * way round for this model, and inferring the background from the frame BORDER
 * fails on a tight head-and-shoulders crop, where the shoulders run off the
 * edges so the border IS the person. The middle of a portrait is the subject
 * essentially always.
 */
function personLabelFrom(maskData, mw, mh) {
  const counts = new Map()
  for (let y = Math.floor(mh * 0.25); y < Math.ceil(mh * 0.65); y += 1) {
    for (let x = Math.floor(mw * 0.35); x < Math.ceil(mw * 0.65); x += 1) {
      const v = maskData[y * mw + x]
      counts.set(v, (counts.get(v) || 0) + 1)
    }
  }
  let label = 0
  let best = -1
  counts.forEach((n, v) => {
    if (n > best) {
      best = n
      label = v
    }
  })
  return label
}

/**
 * Turn the hard category mask into a smooth coverage map at mask resolution.
 *
 * The category mask is binary and 256 across. Sampled nearest-neighbour into a
 * 1600px image that is a staircase roughly six pixels per step — precisely the
 * blocky outline that looked wrong. Blurring it in its own space and then
 * interpolating gives a soft, believable edge instead.
 */
function buildCoverage(maskData, mw, mh, personLabel) {
  const cov = new Float32Array(mw * mh)
  for (let i = 0; i < maskData.length; i += 1) cov[i] = maskData[i] === personLabel ? 1 : 0

  // Separable 3-tap blur, twice — cheap, and enough to take the corners off the
  // 256-grid without eating into the subject.
  const tmp = new Float32Array(mw * mh)
  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < mh; y += 1) {
      for (let x = 0; x < mw; x += 1) {
        const l = cov[y * mw + Math.max(0, x - 1)]
        const c = cov[y * mw + x]
        const r = cov[y * mw + Math.min(mw - 1, x + 1)]
        tmp[y * mw + x] = (l + c + c + r) / 4
      }
    }
    for (let y = 0; y < mh; y += 1) {
      for (let x = 0; x < mw; x += 1) {
        const u = tmp[Math.max(0, y - 1) * mw + x]
        const c = tmp[y * mw + x]
        const d = tmp[Math.min(mh - 1, y + 1) * mw + x]
        cov[y * mw + x] = (u + c + c + d) / 4
      }
    }
  }
  return cov
}

/** Bilinear read of the coverage map, in normalised coordinates. */
function sampleCoverage(cov, mw, mh, u, v) {
  const fx = Math.min(mw - 1, Math.max(0, u * mw - 0.5))
  const fy = Math.min(mh - 1, Math.max(0, v * mh - 0.5))
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(mw - 1, x0 + 1)
  const y1 = Math.min(mh - 1, y0 + 1)
  const tx = fx - x0
  const ty = fy - y0
  const a = cov[y0 * mw + x0]
  const b = cov[y0 * mw + x1]
  const c = cov[y1 * mw + x0]
  const d = cov[y1 * mw + x1]
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty
}

/**
 * Trim transparent margins so the subject fills the poster slot.
 *
 * Phone photos are mostly background. Without this the person is fitted to a
 * frame that is nine-tenths empty air and lands in the poster the size of a
 * stamp. The threshold is on solid coverage rather than any visible alpha, so
 * the soft edge does not drag the box back out to the whole frame.
 */
function cropToSubject(canvas, padRatio = 0.015) {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const { data } = ctx.getImageData(0, 0, w, h)

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  const step = Math.max(1, Math.floor(Math.min(w, h) / 400))
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 140) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return canvas

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
 * @returns {Promise<HTMLImageElement>} the cut-out, with alpha
 */
export async function removeBackground(img) {
  const segmenter = await getSegmenter()

  // --- 1. segment a small copy -------------------------------------------
  const ss = Math.min(1, SEG_SIZE / Math.max(img.width, img.height))
  const sw = Math.max(1, Math.round(img.width * ss))
  const sh = Math.max(1, Math.round(img.height * ss))
  const small = document.createElement('canvas')
  small.width = sw
  small.height = sh
  small.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, sw, sh)

  const result = segmenter.segment(small)
  const mask = result.categoryMask
  if (!mask) {
    result.close?.()
    throw new Error('Segmentation returned no mask.')
  }
  const maskData = mask.getAsUint8Array()
  // The mask comes back at the MODEL's resolution, not the canvas's. Indexing
  // it at the canvas stride reads across rows wrongly and yields a mask of
  // nothing — which once cost three rounds of chasing the wrong bug.
  const mw = mask.width || sw
  const mh = mask.height || sh
  const personLabel = personLabelFrom(maskData, mw, mh)
  const cov = buildCoverage(maskData, mw, mh, personLabel)
  mask.close?.()
  result.close?.()

  // --- 2. apply it to the FULL-resolution original -----------------------
  const os = Math.min(1, OUT_MAX / Math.max(img.width, img.height))
  const ow = Math.max(1, Math.round(img.width * os))
  const oh = Math.max(1, Math.round(img.height * os))

  const full = document.createElement('canvas')
  full.width = ow
  full.height = oh
  const fctx = full.getContext('2d', { willReadFrequently: true })
  fctx.imageSmoothingEnabled = true
  fctx.imageSmoothingQuality = 'high'
  fctx.drawImage(img, 0, 0, ow, oh)

  const frame = fctx.getImageData(0, 0, ow, oh)
  const px = frame.data
  for (let y = 0; y < oh; y += 1) {
    const v = (y + 0.5) / oh
    for (let x = 0; x < ow; x += 1) {
      const u = (x + 0.5) / ow
      let c = sampleCoverage(cov, mw, mh, u, v)
      // Push the ramp toward the extremes so the subject stays solid and the
      // background goes fully clear, leaving a transition only at the true
      // boundary rather than a general haze across everything.
      c = c <= 0.35 ? 0 : c >= 0.65 ? 1 : (c - 0.35) / 0.3
      // Alpha only. Zeroing colour as well leaves a dark halo, because any
      // later blend then pulls black in from the cleared pixels.
      px[(y * ow + x) * 4 + 3] = Math.round(px[(y * ow + x) * 4 + 3] * c)
    }
  }
  fctx.putImageData(frame, 0, 0)

  const cropped = cropToSubject(full)

  const out = new Image()
  out.src = cropped.toDataURL('image/png')
  await out.decode()
  return out
}

/** Warm the runtime so the first real click is quick. Safe to ignore. */
export function prewarm() {
  getSegmenter().catch(() => {})
}
