/**
 * The FALLBACK cut-out: MediaPipe's selfie segmenter plus a guided filter.
 *
 * The main path is MODNet in a worker (src/lib/removeBackground.js). This one
 * exists for the browsers that cannot run it — no WebAssembly SIMD (iOS before
 * 16.4), or a worker that could not start — so that the poster still gets a
 * cut-out rather than a rectangle. It was the only path until September 2026.
 *
 * It returns a matte, not a finished image: the same finishing step as the
 * main path (colour decontamination, cut detection, trimming) then runs on it,
 * so the two paths hand the poster renderer the same kind of result.
 *
 * What changed from the version that shipped alone: the frame-edge feather and
 * the matte softening are gone. Both blurred the subject's edge everywhere,
 * which the office rightly called a bad fade; the renderer now fades only a
 * real cut in the photograph, and only where that cut is visible.
 */
import { fastGuidedFilter, keepMainSubject, suppressDetachedHaze } from './matting'

const WASM_BASE = '/vision'
const MODEL = '/vision/selfie_segmenter.tflite'

/** Segmentation input size. The model works at 256; a little headroom helps the
 *  mask edge and costs nothing meaningful. */
const SEG_SIZE = 512

/** Resolution the guided filter runs at. This is where edge quality is decided,
 *  so it wants to be well above the mask's 256 — but it is also the only real
 *  cost in here, and it is quadratic. 1024 is comfortably past the point where
 *  more stops being visible in a poster slot ~660px wide. The colour filter
 *  needs seventeen box passes against the luma version's six, which would have
 *  made this unaffordable — but those passes run on a subsampled grid (see
 *  fastGuidedFilter), so the resolution here costs only one cheap pass. */
const REFINE_MAX = 1024

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
        // Both, but the confidence mask is the one that matters — see the note
        // at the top. The category mask is kept only as a fallback for a runtime
        // that does not hand back confidence masks.
        outputConfidenceMasks: true,
        outputCategoryMask: true,
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

/** Mean of a mask over the middle of the frame. The centre of a portrait is the
 *  subject essentially always — the one assumption in here that has held up. */
function centreMean(data, w, h) {
  let sum = 0
  let n = 0
  for (let y = Math.floor(h * 0.3); y < Math.ceil(h * 0.62); y += 1) {
    for (let x = Math.floor(w * 0.36); x < Math.ceil(w * 0.64); x += 1) {
      sum += data[y * w + x]
      n += 1
    }
  }
  return n ? sum / n : 0
}

/**
 * The person prior, as a 0..1 map at the model's own resolution.
 *
 * Which output is the person is READ, not assumed. Two earlier versions got this
 * wrong instructively: the documented "0 is background" is the wrong way round
 * for this model, and inferring the background from the frame BORDER fails on a
 * tight head-and-shoulders crop, where the shoulders run off the edges so the
 * border IS the person.
 */
function personPrior(result, fallbackW, fallbackH) {
  const conf = result.confidenceMasks

  if (conf && conf.length) {
    let best = null
    let bestScore = -Infinity
    conf.forEach((m) => {
      const score = centreMean(m.getAsFloat32Array(), m.width, m.height)
      if (score > bestScore) {
        bestScore = score
        best = m
      }
    })
    // Copy out before close() — the underlying buffer is pooled and reused.
    const cov = Float32Array.from(best.getAsFloat32Array())
    const mw = best.width
    const mh = best.height
    conf.forEach((m) => m.close?.())

    /*
     * A single-mask runtime hands back one channel and nothing guarantees which
     * way round it is. If the middle of the frame is almost empty then the mask
     * is inverted, because the alternative is that the photographer centred on
     * the background. The threshold sits far from 0.5 deliberately: it should
     * fire on a mask that is clearly backwards, never on one merely uncertain.
     */
    if (centreMean(cov, mw, mh) < 0.25) {
      for (let i = 0; i < cov.length; i += 1) cov[i] = 1 - cov[i]
    }
    return { cov, mw, mh }
  }

  const mask = result.categoryMask
  if (!mask) throw new Error('Segmentation returned no mask.')
  const data = mask.getAsUint8Array()
  // The mask comes back at the MODEL's resolution, not the canvas's. Indexing it
  // at the canvas stride reads across rows wrongly and yields a mask of nothing
  // — which once cost three rounds of chasing the wrong bug.
  const mw = mask.width || fallbackW
  const mh = mask.height || fallbackH

  const counts = new Map()
  for (let y = Math.floor(mh * 0.3); y < Math.ceil(mh * 0.62); y += 1) {
    for (let x = Math.floor(mw * 0.36); x < Math.ceil(mw * 0.64); x += 1) {
      const v = data[y * mw + x]
      counts.set(v, (counts.get(v) || 0) + 1)
    }
  }
  let label = 0
  let bestCount = -1
  counts.forEach((n, v) => {
    if (n > bestCount) {
      bestCount = n
      label = v
    }
  })

  const cov = new Float32Array(mw * mh)
  for (let i = 0; i < data.length; i += 1) cov[i] = data[i] === label ? 1 : 0
  mask.close?.()
  return { cov, mw, mh }
}

/** Bilinear read of a coverage map, in normalised coordinates. */
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
 * Guided-filter radius, in pixels at the refinement resolution.
 *
 * This number was swept, not chosen, because intuition got it badly wrong: the
 * first attempt used a fortieth of this and barely moved the boundary at all.
 * On a bench comparing a prior deliberately placed 8px off a known edge:
 *
 *     radius     edge error     final edge width     hair recovered
 *       4          7.7 px            13 px               0.02
 *      16          2.8 px            15 px               0.22
 *      48          1.2 px             6 px               0.60
 *      64          0.6 px             1 px               0.68
 *
 * Both columns improve together, which is not what one expects of a smoothing
 * radius. The reason is the output curve further down. A wide radius produces a
 * steep centre with long shallow tails; the curve clips the tails and keeps the
 * centre, so a wider filter ends up with a CRISPER final edge, not a softer one.
 * Hair recovery rises with radius simply because the filter has to reach far
 * enough from the head to see the strands at all — at radius 4 it recovers 2% of
 * them, which is the "hair is being removed" complaint in one number.
 *
 * Cost does not enter into it: every box filter here is a running sum, so radius
 * is free. The ceiling exists because the local linear model wants roughly one
 * edge per window, and a window spanning a quarter of the frame will not get it.
 *
 * Tied to the image's own size so behaviour does not change with input size, and
 * set against how far hair actually strays from a head — tens of pixels at this
 * working resolution, hence a sixteenth rather than a fortieth.
 */
function refineRadius(rw, rh) {
  return Math.min(96, Math.max(24, Math.round(Math.max(rw, rh) / 16)))
}


/**
 * A 0..1 matte for `img`, at up to REFINE_MAX on the long side.
 * @returns {Promise<{alpha: Float32Array, w: number, h: number}>}
 */
export async function mediapipeMatte(img) {
  const segmenter = await getSegmenter()

  const ss = Math.min(1, SEG_SIZE / Math.max(img.width, img.height))
  const sw = Math.max(1, Math.round(img.width * ss))
  const sh = Math.max(1, Math.round(img.height * ss))
  const small = document.createElement('canvas')
  small.width = sw
  small.height = sh
  small.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, sw, sh)

  const result = segmenter.segment(small)
  let coarse
  try {
    coarse = personPrior(result, sw, sh)
  } finally {
    result.close?.()
  }

  const rs = Math.min(1, REFINE_MAX / Math.max(img.width, img.height))
  const rw = Math.max(1, Math.round(img.width * rs))
  const rh = Math.max(1, Math.round(img.height * rs))
  const refine = document.createElement('canvas')
  refine.width = rw
  refine.height = rh
  const rctx = refine.getContext('2d', { willReadFrequently: true })
  rctx.imageSmoothingEnabled = true
  rctx.imageSmoothingQuality = 'high'
  rctx.drawImage(img, 0, 0, rw, rh)
  const guidePx = rctx.getImageData(0, 0, rw, rh).data

  const gR = new Float32Array(rw * rh)
  const gG = new Float32Array(rw * rh)
  const gB = new Float32Array(rw * rh)
  for (let i = 0, j = 0; i < gR.length; i += 1, j += 4) {
    gR[i] = guidePx[j] / 255
    gG[i] = guidePx[j + 1] / 255
    gB[i] = guidePx[j + 2] / 255
  }

  // The prior is sharpened on the way in: the filter finds the edge from the
  // photograph; the prior only has to say which side is the person.
  const prior = new Float32Array(rw * rh)
  for (let y = 0; y < rh; y += 1) {
    const v = (y + 0.5) / rh
    for (let x = 0; x < rw; x += 1) {
      const p = sampleCoverage(coarse.cov, coarse.mw, coarse.mh, (x + 0.5) / rw, v)
      const s = (p - 0.35) / 0.3
      prior[y * rw + x] = s <= 0 ? 0 : s >= 1 ? 1 : s
    }
  }

  const alpha = fastGuidedFilter(gR, gG, gB, prior, rw, rh, refineRadius(rw, rh), 1e-4)
  // A gentle output curve: low enough a floor to keep fine hair, high enough
  // a ceiling that the body is fully solid.
  for (let i = 0; i < alpha.length; i += 1) {
    const c = (alpha[i] - 0.14) / 0.72
    alpha[i] = c <= 0 ? 0 : c >= 1 ? 1 : c
  }
  keepMainSubject(alpha, rw, rh)
  suppressDetachedHaze(alpha, rw, rh)
  return { alpha, w: rw, h: rh }
}

/** Warm the runtime. Safe to ignore. */
export function prewarmMediapipe() {
  getSegmenter().catch(() => {})
}
