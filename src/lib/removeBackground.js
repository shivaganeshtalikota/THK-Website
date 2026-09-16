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
 * THE SHAPE OF THE PROBLEM, AND WHY THE EARLIER VERSIONS LOOKED BAD
 *
 * The model emits a 256x256 mask whatever it is given. Against a 1600px cut-out
 * that is one mask pixel per six image pixels, so the mask ALONE can never
 * describe a hairline. Two mistakes followed from ignoring that:
 *
 *   1. Asking for the CATEGORY mask — a hard person/not-person label per pixel.
 *      A hair strand covers part of a pixel, so a binary vote either deletes it
 *      or keeps a square of background attached to it. That is why people's
 *      hair, and occasionally the top of a head, went missing.
 *   2. Scaling that coarse mask up and calling it an edge. Interpolation makes a
 *      blurry boundary, not a correct one; it cannot invent a hairline that was
 *      never in the 256-grid.
 *
 * HOW THIS VERSION WORKS
 *
 *   a. Segment a small copy. The model down-samples to 256 regardless, so a
 *      12-megapixel input buys nothing.
 *   b. Take the CONFIDENCE mask, not the category mask: a continuous 0..1
 *      probability, so a half-covered hair pixel arrives half-opaque, which is
 *      what it physically is.
 *   c. Treat that only as a PRIOR — roughly where the person is — and refine it
 *      with a guided filter whose guide is the photograph itself. The filter
 *      re-fits the alpha to local image structure, so the boundary moves onto
 *      the real edge of the head and follows hair the 256-grid never saw. This
 *      is the step that makes the cut-out look actually cut out.
 *   d. Apply the refined alpha to the FULL-RESOLUTION original, so the result is
 *      only ever as soft as the photograph it came from.
 *
 * The guided filter is O(number of pixels) — every box filter below is a running
 * sum, not a window scan — so this stays fast enough to run on a phone.
 */

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

/** Ceiling for the cut-out handed back. The poster slot is ~660x1060 at full
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
 * Mean over a (2r+1) square, by running sum.
 *
 * Written incrementally rather than as a window scan on purpose: the guided
 * filter calls this six times over a megapixel, and the naive version would be
 * radius-squared work per pixel and far too slow on a phone. Edges divide by the
 * count actually in range, so the border is averaged rather than darkened.
 */
function boxMean(src, w, h, r) {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)

  for (let y = 0; y < h; y += 1) {
    const row = y * w
    let sum = 0
    let count = 0
    for (let x = 0; x <= r && x < w; x += 1) {
      sum += src[row + x]
      count += 1
    }
    for (let x = 0; x < w; x += 1) {
      tmp[row + x] = sum / count
      const add = x + r + 1
      const sub = x - r
      if (add < w) {
        sum += src[row + add]
        count += 1
      }
      if (sub >= 0) {
        sum -= src[row + sub]
        count -= 1
      }
    }
  }

  for (let x = 0; x < w; x += 1) {
    let sum = 0
    let count = 0
    for (let y = 0; y <= r && y < h; y += 1) {
      sum += tmp[y * w + x]
      count += 1
    }
    for (let y = 0; y < h; y += 1) {
      out[y * w + x] = sum / count
      const add = y + r + 1
      const sub = y - r
      if (add < h) {
        sum += tmp[add * w + x]
        count += 1
      }
      if (sub >= 0) {
        sum -= tmp[sub * w + x]
        count -= 1
      }
    }
  }

  return out
}

/**
 * He, Sun and Tang's guided filter, colour form — the step that finds the edge.
 *
 * In every window it fits the linear map alpha ~= a·colour + b that best
 * explains the prior, then averages the overlapping fits. Where the photograph
 * has real structure — the boundary between hair and wall — the colour
 * covariance is large, `a` is large, and alpha gets pulled onto that structure.
 * Where it is flat, `a` collapses toward zero and alpha simply holds its local
 * average, so the inside of a face does not acquire texture.
 *
 * The result is a matte aligned to the photograph rather than to the model's
 * 256-grid, which is why hair survives this version and did not survive the one
 * before it.
 *
 * WHY COLOUR AND NOT BRIGHTNESS. The first attempt fitted against luma alone,
 * which is a third of the cost and looked fine on a bench. On a real photograph
 * — grey hair against sunlit foliage — it left a wide green halo round the head,
 * because hair and leaves sat at almost the same brightness and a scalar fit has
 * no way to tell them apart. In colour they are nowhere near each other. The
 * filter cannot discriminate on an axis it cannot see, and the halo was the
 * visible proof of that.
 *
 * eps sets what counts as flat. Too large and the filter stops following hair;
 * too small and it starts following sensor noise.
 */
function guidedCoefficients(R, G, B, prior, w, h, r, eps) {
  const n = w * h
  const mul = (x, y) => {
    const o = new Float32Array(n)
    for (let i = 0; i < n; i += 1) o[i] = x[i] * y[i]
    return o
  }
  const bm = (x) => boxMean(x, w, h, r)

  const mR = bm(R)
  const mG = bm(G)
  const mB = bm(B)
  const mP = bm(prior)

  const mRp = bm(mul(R, prior))
  const mGp = bm(mul(G, prior))
  const mBp = bm(mul(B, prior))

  const mRR = bm(mul(R, R))
  const mRG = bm(mul(R, G))
  const mRB = bm(mul(R, B))
  const mGG = bm(mul(G, G))
  const mGB = bm(mul(G, B))
  const mBB = bm(mul(B, B))

  const aR = new Float32Array(n)
  const aG = new Float32Array(n)
  const aB = new Float32Array(n)
  const b = new Float32Array(n)

  for (let i = 0; i < n; i += 1) {
    // Colour covariance in this window, regularised by eps on the diagonal.
    const s11 = mRR[i] - mR[i] * mR[i] + eps
    const s12 = mRG[i] - mR[i] * mG[i]
    const s13 = mRB[i] - mR[i] * mB[i]
    const s22 = mGG[i] - mG[i] * mG[i] + eps
    const s23 = mGB[i] - mG[i] * mB[i]
    const s33 = mBB[i] - mB[i] * mB[i] + eps

    // Symmetric 3x3 inverse by cofactors — cheaper and steadier than a general
    // solver, and this runs once per pixel.
    const i11 = s22 * s33 - s23 * s23
    const i12 = s13 * s23 - s12 * s33
    const i13 = s12 * s23 - s13 * s22
    const i22 = s11 * s33 - s13 * s13
    const i23 = s13 * s12 - s11 * s23
    const i33 = s11 * s22 - s12 * s12

    let det = s11 * i11 + s12 * i12 + s13 * i13
    /*
     * A covariance matrix is positive semi-definite, so adding eps down the
     * diagonal makes this strictly positive — det >= eps^3 — and no clamp is
     * needed on paper. The guard is only against float32 cancellation in
     * E[xy]-E[x]E[y] tipping a near-zero determinant negative.
     *
     * It is set far below eps^3 on purpose. An earlier version clamped at 1e-12,
     * which for eps=1e-4 IS eps^3: it fired on every flat window and on any grey
     * one, quietly damping the fit instead of leaving it alone. It showed up as a
     * self-guided filter that was no longer the identity.
     */
    if (!(det > 1e-20)) det = 1e-20

    const cR = mRp[i] - mR[i] * mP[i]
    const cG = mGp[i] - mG[i] * mP[i]
    const cB = mBp[i] - mB[i] * mP[i]

    const ar = (i11 * cR + i12 * cG + i13 * cB) / det
    const ag = (i12 * cR + i22 * cG + i23 * cB) / det
    const ab = (i13 * cR + i23 * cG + i33 * cB) / det

    aR[i] = ar
    aG[i] = ag
    aB[i] = ab
    b[i] = mP[i] - ar * mR[i] - ag * mG[i] - ab * mB[i]
  }

  return { aR: bm(aR), aG: bm(aG), aB: bm(aB), b: bm(b) }
}

/** Block-average an image down by `s`. Averaging rather than dropping pixels,
 *  so the coarse grid still reflects everything in the frame. */
function shrink(src, w, h, s, sw, sh) {
  const out = new Float32Array(sw * sh)
  for (let y = 0; y < sh; y += 1) {
    const y0 = y * s
    const y1 = Math.min(h, y0 + s)
    for (let x = 0; x < sw; x += 1) {
      const x0 = x * s
      const x1 = Math.min(w, x0 + s)
      let sum = 0
      let n = 0
      for (let yy = y0; yy < y1; yy += 1) {
        for (let xx = x0; xx < x1; xx += 1) {
          sum += src[yy * w + xx]
          n += 1
        }
      }
      out[y * sw + x] = n ? sum / n : 0
    }
  }
  return out
}

/**
 * He and Sun's FAST guided filter.
 *
 * The coefficients are worked out on a subsampled grid and then applied to the
 * full-resolution photograph. That sounds like it should cost detail and does
 * not, because a and b have already been averaged over the filter radius —
 * they vary slowly by construction, so a coarse grid describes them well. The
 * detail in the output comes from the full-resolution pixels in the final
 * `a·colour + b`, not from the grid the coefficients were fitted on.
 *
 * It matters here because the colour filter needs seventeen box passes rather
 * than six, and a megapixel of that was over a second on a desktop — which on
 * the mid-range phones this site is actually used from would have been the
 * difference between a feature and an abandoned tab. Subsampling by four cuts
 * the fitting work roughly sixteen-fold and leaves the hair where it was.
 */
function fastGuidedFilter(R, G, B, prior, w, h, r, eps, sub = 4) {
  const s = Math.max(1, Math.round(sub))
  if (s === 1) {
    const c = guidedCoefficients(R, G, B, prior, w, h, r, eps)
    const out = new Float32Array(w * h)
    for (let i = 0; i < out.length; i += 1) {
      out[i] = c.aR[i] * R[i] + c.aG[i] * G[i] + c.aB[i] * B[i] + c.b[i]
    }
    return out
  }

  const sw = Math.max(1, Math.ceil(w / s))
  const sh = Math.max(1, Math.ceil(h / s))
  const c = guidedCoefficients(
    shrink(R, w, h, s, sw, sh),
    shrink(G, w, h, s, sw, sh),
    shrink(B, w, h, s, sw, sh),
    shrink(prior, w, h, s, sw, sh),
    sw,
    sh,
    Math.max(1, Math.round(r / s)),
    eps,
  )

  /*
   * Upsample the four coefficient maps and apply them, in one pass.
   *
   * The bilinear weights depend only on the pixel, not on which map is being
   * read, so they are computed once and reused four times. Written as four
   * sampleCoverage() calls this was the hot loop of the whole function, doing
   * the same index arithmetic four times over for every pixel in the image.
   */
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y += 1) {
    const fy = Math.min(sh - 1, Math.max(0, ((y + 0.5) / h) * sh - 0.5))
    const y0 = Math.floor(fy)
    const y1 = Math.min(sh - 1, y0 + 1)
    const ty = fy - y0

    for (let x = 0; x < w; x += 1) {
      const fx = Math.min(sw - 1, Math.max(0, ((x + 0.5) / w) * sw - 0.5))
      const x0 = Math.floor(fx)
      const x1 = Math.min(sw - 1, x0 + 1)
      const tx = fx - x0

      const i00 = y0 * sw + x0
      const i10 = y0 * sw + x1
      const i01 = y1 * sw + x0
      const i11 = y1 * sw + x1
      const w00 = (1 - tx) * (1 - ty)
      const w10 = tx * (1 - ty)
      const w01 = (1 - tx) * ty
      const w11 = tx * ty

      const i = y * w + x
      out[i] =
        (c.aR[i00] * w00 + c.aR[i10] * w10 + c.aR[i01] * w01 + c.aR[i11] * w11) * R[i] +
        (c.aG[i00] * w00 + c.aG[i10] * w10 + c.aG[i01] * w01 + c.aG[i11] * w11) * G[i] +
        (c.aB[i00] * w00 + c.aB[i10] * w10 + c.aB[i01] * w01 + c.aB[i11] * w11) * B[i] +
        (c.b[i00] * w00 + c.b[i10] * w10 + c.b[i01] * w01 + c.b[i11] * w11)
    }
  }
  return out
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
 * Trim transparent margins so the subject fills the poster slot.
 *
 * Phone photos are mostly background; without this the person is fitted to a
 * frame that is nine-tenths empty air and lands in the poster the size of a
 * stamp.
 *
 * Two passes, because the two failure modes pull in opposite directions. A high
 * threshold crops to the solid body and slices the soft top of the head off —
 * that is the "heads are removed" complaint. A low threshold keeps the hair but
 * lets one stray speck of leftover background stretch the box across the whole
 * frame. So: find the box on solid pixels, then let faint pixels extend it, but
 * only by a fraction of the box's own size. Hair sits just outside the solid
 * body; specks do not.
 */
function cropToSubject(canvas, padRatio = 0.02) {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const { data } = ctx.getImageData(0, 0, w, h)

  const step = Math.max(1, Math.floor(Math.min(w, h) / 500))

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 160) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return canvas

  // How far beyond the solid body faint pixels are allowed to reach.
  const slackX = Math.round((maxX - minX) * 0.12)
  const slackY = Math.round((maxY - minY) * 0.12)
  const loX = Math.max(0, minX - slackX)
  const hiX = Math.min(w - 1, maxX + slackX)
  const loY = Math.max(0, minY - slackY)
  const hiY = Math.min(h - 1, maxY + slackY)

  for (let y = loY; y <= hiY; y += step) {
    for (let x = loX; x <= hiX; x += step) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

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
  let coarse
  try {
    coarse = personPrior(result, sw, sh)
  } finally {
    result.close?.()
  }

  // --- 2. refine the prior against the photograph itself ------------------
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

  const prior = new Float32Array(rw * rh)
  for (let y = 0; y < rh; y += 1) {
    const v = (y + 0.5) / rh
    for (let x = 0; x < rw; x += 1) {
      /*
       * Sharpened on the way in.
       *
       * The model's confidence trails off gradually either side of a boundary,
       * and handing the filter a prior that is already vague makes it spread
       * that vagueness over a whole radius. The filter's job is to find the edge
       * from the PHOTOGRAPH; the prior only has to say which side is the person.
       * Nothing is lost by committing here — hair is not in the prior at all,
       * it is recovered from the guide further down.
       */
      const p = sampleCoverage(coarse.cov, coarse.mw, coarse.mh, (x + 0.5) / rw, v)
      const s = (p - 0.35) / 0.3
      prior[y * rw + x] = s <= 0 ? 0 : s >= 1 ? 1 : s
    }
  }

  const alpha = fastGuidedFilter(gR, gG, gB, prior, rw, rh, refineRadius(rw, rh), 1e-4)

  /*
   * A gentle curve, not a near-binary one.
   *
   * The previous version snapped everything below 0.35 to nothing, which is
   * exactly where hair lives: fine strands never reach high confidence, so they
   * were deleted wholesale. The floor here is low enough to keep them and the
   * ceiling low enough that the body stays fully solid, with a real ramp in
   * between rather than a cliff.
   */
  for (let i = 0; i < alpha.length; i += 1) {
    const c = (alpha[i] - 0.14) / 0.72
    alpha[i] = c <= 0 ? 0 : c >= 1 ? 1 : c
  }

  // --- 3. apply it to the FULL-resolution original ------------------------
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
      const c = sampleCoverage(alpha, rw, rh, (x + 0.5) / ow, v)
      // Alpha only. Zeroing colour as well leaves a dark halo, because any later
      // blend then pulls black in from the cleared pixels.
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
