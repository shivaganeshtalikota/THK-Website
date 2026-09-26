/**
 * The arithmetic of cutting a person out: pure functions over typed arrays.
 *
 * No DOM, no canvas — so it runs unchanged inside the Web Worker that does the
 * real work (src/lib/cutout.worker.js) and on the main thread when a browser
 * cannot start that worker. Every filter here is linear in the number of
 * pixels: box filters are running sums, never window scans, because this runs
 * on the mid-range phones the site is actually used from.
 */

/**
 * MODNet's input size for a photo of w x h: long side 512 (its training
 * reference size), both sides multiples of 32. Lives here rather than beside
 * the model so that asking the question does not pull the ONNX runtime into
 * the page — only the worker needs that.
 */
export function modnetDims(w, h) {
  const s = 512 / Math.max(w, h)
  return {
    w: Math.max(32, Math.round((w * s) / 32) * 32),
    h: Math.max(32, Math.round((h * s) / 32) * 32),
  }
}

/* ------------------------------------------------------------ filters */

/** Mean over a (2r+1) square by running sum. Edges divide by the count
 *  actually in range, so the border is averaged rather than darkened. */
export function boxMean(src, w, h, r) {
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
 * He, Sun and Tang's guided filter, colour form: per window, fit
 * alpha ~= a·colour + b to the prior, then average the overlapping fits.
 * Where the photograph has structure the fit follows it; where it is flat the
 * alpha holds its local average. Returns the averaged coefficient maps.
 */
export function guidedCoefficients(R, G, B, prior, w, h, r, eps) {
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
    const s11 = mRR[i] - mR[i] * mR[i] + eps
    const s12 = mRG[i] - mR[i] * mG[i]
    const s13 = mRB[i] - mR[i] * mB[i]
    const s22 = mGG[i] - mG[i] * mG[i] + eps
    const s23 = mGB[i] - mG[i] * mB[i]
    const s33 = mBB[i] - mB[i] * mB[i] + eps
    const i11 = s22 * s33 - s23 * s23
    const i12 = s13 * s23 - s12 * s33
    const i13 = s12 * s23 - s13 * s22
    const i22 = s11 * s33 - s13 * s13
    const i23 = s13 * s12 - s11 * s23
    const i33 = s11 * s22 - s12 * s12
    let det = s11 * i11 + s12 * i12 + s13 * i13
    // Positive on paper (covariance + eps·I); the guard is only against
    // float32 cancellation tipping a near-zero determinant negative.
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
export function fastGuidedFilter(R, G, B, prior, w, h, r, eps, sub = 4) {
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

/** RGBA bytes -> three 0..1 planes. */
export function planes(rgba, w, h) {
  const n = w * h
  const R = new Float32Array(n)
  const G = new Float32Array(n)
  const B = new Float32Array(n)
  for (let i = 0, j = 0; i < n; i += 1, j += 4) {
    R[i] = rgba[j] / 255
    G[i] = rgba[j + 1] / 255
    B[i] = rgba[j + 2] / 255
  }
  return { R, G, B }
}

/* -------------------------------------------------- subject isolation */

/**
 * Keep the person whose photograph this is; drop everyone else in it.
 *
 * Portrait models segment PEOPLE, and a supporter's photo usually has others
 * in it — a shoulder at the edge of a rally, a second figure at a function.
 * Each connected region is scored by area weighted toward the middle and the
 * lower part of the frame (the subject is what the camera was aimed at;
 * bystanders tend to be heads along the top), and the best one is kept.
 * Labelled at a LOW threshold so hair stays attached to its head.
 *
 * With a detected face (0..1 box of the photo), the question is settled
 * directly: the region with the most of its matte inside that face is the
 * person the photo is of. The position scoring is the fallback for photos in
 * which no face was found.
 */
export function keepMainSubject(alpha, w, h, face = null) {
  const PRESENT = 0.1
  const labels = new Int32Array(w * h).fill(-1)
  const stack = new Int32Array(w * h)
  const regions = []
  const fx1 = face ? face.x1 * w : 0
  const fx2 = face ? face.x2 * w : 0
  const fy1 = face ? face.y1 * h : 0
  const fy2 = face ? face.y2 * h : 0
  for (let seed = 0; seed < labels.length; seed += 1) {
    if (labels[seed] !== -1 || alpha[seed] < PRESENT) continue
    const id = regions.length
    let score = 0
    let inFace = 0
    let top = 0
    stack[top++] = seed
    labels[seed] = id
    while (top > 0) {
      const i = stack[--top]
      const x = i % w
      const y = (i / w) | 0
      const cx = 1 - Math.abs(x / w - 0.5) * 2
      const cy = 0.4 + 0.6 * (y / h)
      score += alpha[i] * cx * cx * cy
      if (face && x >= fx1 && x <= fx2 && y >= fy1 && y <= fy2) inFace += alpha[i]
      if (x > 0 && labels[i - 1] === -1 && alpha[i - 1] >= PRESENT) { labels[i - 1] = id; stack[top++] = i - 1 }
      if (x < w - 1 && labels[i + 1] === -1 && alpha[i + 1] >= PRESENT) { labels[i + 1] = id; stack[top++] = i + 1 }
      if (y > 0 && labels[i - w] === -1 && alpha[i - w] >= PRESENT) { labels[i - w] = id; stack[top++] = i - w }
      if (y < h - 1 && labels[i + w] === -1 && alpha[i + w] >= PRESENT) { labels[i + w] = id; stack[top++] = i + w }
    }
    regions.push({ id, score, inFace })
  }
  if (regions.length <= 1) return
  let best = regions[0]
  const byFace = face && regions.some((r) => r.inFace > 0)
  for (const r of regions) {
    if (byFace ? r.inFace > best.inFace : r.score > best.score) best = r
  }
  for (let i = 0; i < alpha.length; i += 1) if (labels[i] !== best.id) alpha[i] = 0
}

/** Two-pass chamfer distance to the nearest pixel where `isSource(i)`. */
function chamfer(w, h, isSource) {
  const BIG = 1e9
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i += 1) d[i] = isSource(i) ? 0 : BIG
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      let v = d[i]
      if (x > 0) v = Math.min(v, d[i - 1] + 1)
      if (y > 0) v = Math.min(v, d[i - w] + 1)
      if (x > 0 && y > 0) v = Math.min(v, d[i - w - 1] + 1.414)
      if (x < w - 1 && y > 0) v = Math.min(v, d[i - w + 1] + 1.414)
      d[i] = v
    }
  }
  for (let y = h - 1; y >= 0; y -= 1) {
    for (let x = w - 1; x >= 0; x -= 1) {
      const i = y * w + x
      let v = d[i]
      if (x < w - 1) v = Math.min(v, d[i + 1] + 1)
      if (y < h - 1) v = Math.min(v, d[i + w] + 1)
      if (x < w - 1 && y < h - 1) v = Math.min(v, d[i + w + 1] + 1.414)
      if (x > 0 && y < h - 1) v = Math.min(v, d[i + w - 1] + 1.414)
      d[i] = v
    }
  }
  return d
}

/**
 * Drop a second body that only TOUCHES the subject.
 *
 * keepMainSubject() keeps everything connected to the subject — and a
 * bystander's hand resting on a shoulder is connected. What gives it away is
 * the join: a person's own arm meets their body along a wide front; another
 * person's fingertips meet it at a point. So the matte is eroded by `r`
 * pixels, which parts anything joined through a neck narrower than 2r, and
 * any substantial piece that comes away from the main body is removed.
 *
 * The subject's own fingers and loose hair are thinner than 2r everywhere, so
 * erosion removes them entirely rather than separating them — they are never
 * candidates for removal, and they are left exactly as they were.
 */
export function detachThinNecks(alpha, w, h, r = 3, face = null) {
  const solid = (i) => alpha[i] > 0.5
  const toEdge = chamfer(w, h, (i) => !solid(i))
  const core = new Uint8Array(w * h)
  for (let i = 0; i < core.length; i += 1) core[i] = toEdge[i] > r ? 1 : 0

  // Label the eroded pieces; keep the one the photo is of.
  const labels = new Int32Array(w * h).fill(-1)
  const stack = new Int32Array(w * h)
  const pieces = []
  for (let seed = 0; seed < core.length; seed += 1) {
    if (!core[seed] || labels[seed] !== -1) continue
    const id = pieces.length
    let score = 0
    let area = 0
    let inFace = 0
    let top = 0
    stack[top++] = seed
    labels[seed] = id
    while (top > 0) {
      const i = stack[--top]
      const x = i % w
      const y = (i / w) | 0
      const cx = 1 - Math.abs(x / w - 0.5) * 2
      score += cx * cx * (0.4 + 0.6 * (y / h))
      area += 1
      if (face && x >= face.x1 * w && x <= face.x2 * w && y >= face.y1 * h && y <= face.y2 * h) inFace += 1
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (j < 0 || j >= core.length) continue
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue
        if (core[j] && labels[j] === -1) {
          labels[j] = id
          stack[top++] = j
        }
      }
    }
    pieces.push({ id, score, area, inFace })
  }
  if (pieces.length <= 1) return
  let main = pieces[0]
  const byFace = face && pieces.some((p) => p.inFace > 0)
  for (const p of pieces) if (byFace ? p.inFace > main.inFace : p.score > main.score) main = p
  // Only pieces big enough to be a hand or a shoulder; specks are left to the
  // haze pass, which judges them by opacity.
  const minArea = Math.max(12, (w * h) / 4000)
  const drop = new Set(pieces.filter((p) => p !== main && p.area >= minArea).map((p) => p.id))
  if (!drop.size) return

  const nearMain = chamfer(w, h, (i) => labels[i] === main.id)
  const nearDropped = chamfer(w, h, (i) => drop.has(labels[i]))
  for (let i = 0; i < alpha.length; i += 1) {
    // Closer to a dropped piece than to the subject, and within reach of it:
    // that pixel belongs to the other body.
    if (alpha[i] > 0 && nearDropped[i] <= r + 1.5 && nearDropped[i] < nearMain[i]) alpha[i] = 0
  }
}

/**
 * Fade out faint matte that is nowhere near anything solid.
 *
 * Hair is faint AND close to a solid head; leftover background is faint and
 * far from anything solid. Distance to the nearest confident pixel (two-pass
 * chamfer) separates the two. Solid pixels are never touched.
 */
export function suppressDetachedHaze(alpha, w, h, near = 12, far = 44) {
  const SOLID = 0.65
  const BIG = 1e9
  const dist = new Float32Array(w * h)
  for (let i = 0; i < dist.length; i += 1) dist[i] = alpha[i] >= SOLID ? 0 : BIG
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      let d = dist[i]
      if (x > 0) d = Math.min(d, dist[i - 1] + 1)
      if (y > 0) d = Math.min(d, dist[i - w] + 1)
      if (x > 0 && y > 0) d = Math.min(d, dist[i - w - 1] + 1.414)
      if (x < w - 1 && y > 0) d = Math.min(d, dist[i - w + 1] + 1.414)
      dist[i] = d
    }
  }
  for (let y = h - 1; y >= 0; y -= 1) {
    for (let x = w - 1; x >= 0; x -= 1) {
      const i = y * w + x
      let d = dist[i]
      if (x < w - 1) d = Math.min(d, dist[i + 1] + 1)
      if (y < h - 1) d = Math.min(d, dist[i + w] + 1)
      if (x < w - 1 && y < h - 1) d = Math.min(d, dist[i + w + 1] + 1.414)
      if (x > 0 && y < h - 1) d = Math.min(d, dist[i + w - 1] + 1.414)
      dist[i] = d
    }
  }
  for (let i = 0; i < alpha.length; i += 1) {
    if (alpha[i] >= SOLID) continue
    const d = dist[i]
    if (d <= near) continue
    if (d >= far) {
      alpha[i] = 0
      continue
    }
    const t = 1 - (d - near) / (far - near)
    alpha[i] *= t * t * (3 - 2 * t)
  }
}

/* ------------------------------------------------------ upsampling */

/**
 * Bring a low-resolution matte up to full resolution, ALIGNED to the photo.
 *
 * Plain interpolation of a 512px matte onto a 2400px photograph gives a soft,
 * smeared edge — that softness was the "blurry" in "the subject is blurry".
 * This is the fast guided filter used for joint upsampling: the linear
 * colour→alpha fits are made on the small grid (guide = the small photo,
 * input = the model's matte), and then APPLIED to the full-resolution pixels.
 * The fits vary slowly by construction, so a small grid describes them well;
 * the sharpness comes from the full-resolution colours they are applied to.
 *
 * `lowRgba` is the photo at the matte's size. `full` is the photo at output
 * size. Returns a Float32Array alpha at output size.
 */
export function guidedUpsample(lowAlpha, lowRgba, lw, lh, full, fw, fh, { r = 2, eps = 1e-3 } = {}) {
  const lo = planes(lowRgba, lw, lh)
  const c = guidedCoefficients(lo.R, lo.G, lo.B, lowAlpha, lw, lh, r, eps)
  const out = new Float32Array(fw * fh)
  for (let y = 0; y < fh; y += 1) {
    const fy = Math.min(lh - 1, Math.max(0, ((y + 0.5) / fh) * lh - 0.5))
    const y0 = Math.floor(fy)
    const y1 = Math.min(lh - 1, y0 + 1)
    const ty = fy - y0
    for (let x = 0; x < fw; x += 1) {
      const fx = Math.min(lw - 1, Math.max(0, ((x + 0.5) / fw) * lw - 0.5))
      const x0 = Math.floor(fx)
      const x1 = Math.min(lw - 1, x0 + 1)
      const tx = fx - x0
      const i00 = y0 * lw + x0
      const i10 = y0 * lw + x1
      const i01 = y1 * lw + x0
      const i11 = y1 * lw + x1
      const w00 = (1 - tx) * (1 - ty)
      const w10 = tx * (1 - ty)
      const w01 = (1 - tx) * ty
      const w11 = tx * ty
      const j = (y * fw + x) * 4
      const v =
        (c.aR[i00] * w00 + c.aR[i10] * w10 + c.aR[i01] * w01 + c.aR[i11] * w11) * (full[j] / 255) +
        (c.aG[i00] * w00 + c.aG[i10] * w10 + c.aG[i01] * w01 + c.aG[i11] * w11) * (full[j + 1] / 255) +
        (c.aB[i00] * w00 + c.aB[i10] * w10 + c.aB[i01] * w01 + c.aB[i11] * w11) * (full[j + 2] / 255) +
        (c.b[i00] * w00 + c.b[i10] * w10 + c.b[i01] * w01 + c.b[i11] * w11)
      out[y * fw + x] = v < 0 ? 0 : v > 1 ? 1 : v
    }
  }
  return out
}

/** Bilinear upsample, for a matte that should not be re-fitted. */
export function bilinearUpsample(src, sw, sh, dw, dh) {
  const out = new Float32Array(dw * dh)
  for (let y = 0; y < dh; y += 1) {
    const fy = Math.min(sh - 1, Math.max(0, ((y + 0.5) / dh) * sh - 0.5))
    const y0 = Math.floor(fy)
    const y1 = Math.min(sh - 1, y0 + 1)
    const ty = fy - y0
    for (let x = 0; x < dw; x += 1) {
      const fx = Math.min(sw - 1, Math.max(0, ((x + 0.5) / dw) * sw - 0.5))
      const x0 = Math.floor(fx)
      const x1 = Math.min(sw - 1, x0 + 1)
      const tx = fx - x0
      out[y * dw + x] =
        src[y0 * sw + x0] * (1 - tx) * (1 - ty) +
        src[y0 * sw + x1] * tx * (1 - ty) +
        src[y1 * sw + x0] * (1 - tx) * ty +
        src[y1 * sw + x1] * tx * ty
    }
  }
  return out
}

/* ------------------------------------------------ colour decontamination */

/**
 * Take the background's colour back out of the semi-transparent edge.
 *
 * A hair pixel at 40% opacity is 40% hair and 60% whatever wall was behind it.
 * Composited onto a poster as-is, that 60% comes along — the green fringe
 * round a head photographed against leaves. For each such pixel the local
 * background colour B is estimated from nearby clear background, and the
 * compositing equation I = aF + (1-a)B is solved for the true foreground F.
 * Where alpha is too small for that to be stable, F falls back to the colour
 * of nearby solid foreground instead.
 *
 * Works on a quarter-size grid for the local means (they vary slowly) and on
 * full-size pixels for the solve. Writes into `rgba` in place.
 */
export function decontaminate(rgba, alpha, w, h) {
  const s = 4
  const qw = Math.max(1, Math.ceil(w / s))
  const qh = Math.max(1, Math.ceil(h / s))
  const n = qw * qh
  const acc = {
    bR: new Float32Array(n), bG: new Float32Array(n), bB: new Float32Array(n), bW: new Float32Array(n),
    fR: new Float32Array(n), fG: new Float32Array(n), fB: new Float32Array(n), fW: new Float32Array(n),
  }
  for (let y = 0; y < h; y += 1) {
    const qy = (y / s) | 0
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      const q = qy * qw + ((x / s) | 0)
      const a = alpha[i]
      const j = i * 4
      const wb = (1 - a) * (1 - a)
      const wf = a * a * a
      acc.bR[q] += rgba[j] * wb
      acc.bG[q] += rgba[j + 1] * wb
      acc.bB[q] += rgba[j + 2] * wb
      acc.bW[q] += wb
      acc.fR[q] += rgba[j] * wf
      acc.fG[q] += rgba[j + 1] * wf
      acc.fB[q] += rgba[j + 2] * wf
      acc.fW[q] += wf
    }
  }
  const r = 5
  const m = {}
  for (const k of Object.keys(acc)) m[k] = boxMean(acc[k], qw, qh, r)

  const at = (arr, x, y) => {
    const qx = Math.min(qw - 1, (x / s) | 0)
    const qy = Math.min(qh - 1, (y / s) | 0)
    return arr[qy * qw + qx]
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      const a = alpha[i]
      if (a <= 0.01 || a >= 0.985) continue
      const j = i * 4
      const bw = at(m.bW, x, y) || 1e-6
      const fw = at(m.fW, x, y) || 1e-6
      const B = [at(m.bR, x, y) / bw, at(m.bG, x, y) / bw, at(m.bB, x, y) / bw]
      const Fm = [at(m.fR, x, y) / fw, at(m.fG, x, y) / fw, at(m.fB, x, y) / fw]
      // Weight toward the solve as alpha grows; toward nearby foreground as it
      // shrinks and the solve becomes a division by almost nothing.
      const t = Math.min(1, Math.max(0, (a - 0.12) / 0.4))
      const wS = t * t * (3 - 2 * t)
      for (let k = 0; k < 3; k += 1) {
        let f = (rgba[j + k] - (1 - a) * B[k]) / a
        f = f < 0 ? 0 : f > 255 ? 255 : f
        rgba[j + k] = Math.round(wS * f + (1 - wS) * Fm[k])
      }
    }
  }
}

/* --------------------------------------------------------- finishing */

/**
 * Which edges of the PHOTOGRAPH the subject runs off.
 *
 * A head-and-shoulders photo almost always has the shoulders leaving the frame
 * at the sides and the chest leaving it at the bottom. Those straight cuts are
 * the one thing the poster renderer is allowed to fade — the subject's own
 * outline never is — and it only fades them where they land inside the poster.
 * This is how it knows they exist.
 */
export function frameCuts(alpha, w, h) {
  const line = (get, len) => {
    let on = 0
    for (let k = 0; k < len; k += 1) if (get(k) > 0.5) on += 1
    return on / len
  }
  const inset = 2
  const frac = {
    top: line((x) => alpha[inset * w + x], w),
    bottom: line((x) => alpha[(h - 1 - inset) * w + x], w),
    left: line((y) => alpha[y * w + inset], h),
    right: line((y) => alpha[y * w + (w - 1 - inset)], h),
  }
  const cut = {
    top: frac.top > 0.03,
    bottom: frac.bottom > 0.05,
    left: frac.left > 0.04,
    right: frac.right > 0.04,
  }
  return { cut, frac }
}

/** Tight box around the subject; flush on any side the photo cuts through. */
export function subjectBox(alpha, w, h, cut) {
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (alpha[y * w + x] > 0.04) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h }
  const padX = Math.round((maxX - minX) * 0.01)
  const padY = Math.round((maxY - minY) * 0.01)
  const x0 = cut.left ? 0 : Math.max(0, minX - padX)
  const y0 = cut.top ? 0 : Math.max(0, minY - padY)
  const x1 = cut.right ? w - 1 : Math.min(w - 1, maxX + padX)
  const y1 = cut.bottom ? h - 1 : Math.min(h - 1, maxY + padY)
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/**
 * Alpha + photo -> the finished, trimmed RGBA cut-out.
 * Colour is decontaminated first; then alpha is written; then cropped.
 */
export function finishCutout(rgba, alpha, w, h, face = null) {
  // Snap the last whisper of the tails. Below 2% nobody sees it except as a
  // grey smudge on a light poster; above 98% it is simply solid.
  //
  // Below 30%, the alpha is also CRUSHED (a -> a²/0.3): a faint veil of the
  // photo's own background — a dark wall behind the head, say — otherwise
  // shows on the poster as a grey patch around the subject, and its drop
  // shadow makes it worse. Hair wisps sit mostly above 30% and are untouched;
  // what is fainter than that fades much faster than it did.
  for (let i = 0; i < alpha.length; i += 1) {
    let a = alpha[i]
    if (a < 0.3) a = (a * a) / 0.3
    alpha[i] = a < 0.03 ? 0 : a > 0.98 ? 1 : a
  }
  decontaminate(rgba, alpha, w, h)
  const { cut, frac } = frameCuts(alpha, w, h)
  const box = subjectBox(alpha, w, h, cut)
  const out = new Uint8ClampedArray(box.w * box.h * 4)
  for (let y = 0; y < box.h; y += 1) {
    for (let x = 0; x < box.w; x += 1) {
      const si = (y + box.y) * w + (x + box.x)
      const sj = si * 4
      const dj = (y * box.w + x) * 4
      out[dj] = rgba[sj]
      out[dj + 1] = rgba[sj + 1]
      out[dj + 2] = rgba[sj + 2]
      out[dj + 3] = Math.round(alpha[si] * 255)
    }
  }
  // Where the face is inside the finished cut-out, as fractions of it, for
  // the poster to size and place the person by.
  const faceBox = face
    ? {
        x: (face.x1 * w - box.x) / box.w,
        y: (face.y1 * h - box.y) / box.h,
        w: ((face.x2 - face.x1) * w) / box.w,
        h: ((face.y2 - face.y1) * h) / box.h,
      }
    : null
  return { data: out, w: box.w, h: box.h, cut, frac, box, face: faceBox }
}
