/**
 * Cuts a person out of their photograph, entirely in the browser.
 *
 * WHY IN THE BROWSER
 * Every hosted background-removal API bills per image, and this is meant for
 * campaign days with thousands of party workers. Nor should thousands of
 * people's photographs go to a third party. The photograph never leaves the
 * device: it is read from the file input, matted here, and drawn to a canvas.
 *
 * HOW, IN ORDER OF PREFERENCE
 *   1. MODNet portrait matting in a Web Worker (src/lib/cutout.worker.js).
 *      The quality path, and off the main thread so the page stays alive.
 *   2. The same MODNet pipeline on the main thread, if a worker cannot start.
 *   3. MediaPipe's selfie segmenter plus a guided filter
 *      (src/lib/mediapipeMatte.js), for browsers that cannot run MODNet at
 *      all — no WebAssembly SIMD, which means iOS before 16.4.
 *
 * FULL RESOLUTION
 * The cut-out comes back at up to OUT_MAX pixels on its long side. The poster
 * draws the person up to about 1,300px tall, and an earlier ceiling of 1,600px
 * on the WHOLE photograph meant the subject itself was often under 1,000px and
 * got scaled up — which is the blur people saw. The matte is brought up to this
 * size by guided upsampling, aligned to the photograph's own edges, rather than
 * stretched.
 *
 * WHAT COMES BACK
 * { canvas, cut, engine }: the trimmed cut-out, and which edges of the original
 * photograph the subject ran off. The renderer uses `cut` to fade a sliced
 * shoulder that would otherwise end in a straight line — and nothing else.
 */
import {
  bilinearUpsample,
  detachThinNecks,
  finishCutout,
  guidedUpsample,
  keepMainSubject,
  modnetDims,
  suppressDetachedHaze,
} from './matting'

/** Long side of the returned cut-out. */
const OUT_MAX = 2200

let worker = null
let workerBroken = false
let seq = 0

function getWorker() {
  if (workerBroken || typeof Worker === 'undefined') return null
  if (!worker) {
    try {
      worker = new Worker(new URL('./cutout.worker.js', import.meta.url), { type: 'module' })
      worker.addEventListener('error', () => {
        workerBroken = true
        worker = null
      })
    } catch {
      workerBroken = true
      return null
    }
  }
  return worker
}

/** Draw `img` at w x h and read the pixels back. */
function pixels(img, w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

function outputSize(img) {
  const s = Math.min(1, OUT_MAX / Math.max(img.width, img.height))
  return { w: Math.max(1, Math.round(img.width * s)), h: Math.max(1, Math.round(img.height * s)) }
}

function toCanvas(result) {
  const c = document.createElement('canvas')
  c.width = result.w
  c.height = result.h
  c.getContext('2d').putImageData(new ImageData(result.data, result.w, result.h), 0, 0)
  return c
}

/** Run one job through the worker, reporting stages. Rejects on any failure. */
function viaWorker(w, small, full, onStage) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    let settled = false
    const done = (fn, v) => {
      if (settled) return
      settled = true
      w.removeEventListener('message', onMsg)
      w.removeEventListener('error', onErr)
      clearTimeout(timer)
      fn(v)
    }
    const onMsg = (e) => {
      if (e.data?.id !== id) return
      if (e.data.stage) onStage?.(e.data.stage)
      else if (e.data.error) done(reject, new Error(e.data.error))
      else if (e.data.result) done(resolve, e.data.result)
    }
    const onErr = (e) => done(reject, new Error(e?.message || 'The cut-out worker stopped'))
    // Generous: the first run on a slow phone includes an 8.9MB model download.
    const timer = setTimeout(() => done(reject, new Error('The cut-out took too long')), 120_000)
    w.addEventListener('message', onMsg)
    w.addEventListener('error', onErr)
    w.postMessage(
      { id, small: { data: small.data, w: small.width, h: small.height }, full: { data: full.data, w: full.width, h: full.height } },
      [small.data.buffer, full.data.buffer],
    )
  })
}

/** The same pipeline as the worker, on this thread. */
async function modnetHere(small, full, onStage) {
  onStage?.('model')
  const { runModnet } = await import('./modnet')
  onStage?.('matting')
  const low = await runModnet(small.data, small.width, small.height)
  keepMainSubject(low, small.width, small.height)
  detachThinNecks(low, small.width, small.height)
  keepMainSubject(low, small.width, small.height)
  suppressDetachedHaze(low, small.width, small.height, 6, 22)
  onStage?.('refining')
  const alpha = guidedUpsample(low, small.data, small.width, small.height, full.data, full.width, full.height)
  onStage?.('finishing')
  return finishCutout(full.data, alpha, full.width, full.height)
}

async function mediapipeHere(img, full, onStage) {
  onStage?.('model')
  const { mediapipeMatte } = await import('./mediapipeMatte')
  onStage?.('matting')
  const m = await mediapipeMatte(img)
  onStage?.('finishing')
  const alpha = bilinearUpsample(m.alpha, m.w, m.h, full.width, full.height)
  return finishCutout(full.data, alpha, full.width, full.height)
}

/**
 * Remove the background from a loaded image.
 *
 * @param {HTMLImageElement|ImageBitmap} img
 * @param {{onStage?: (stage: 'model'|'matting'|'refining'|'finishing') => void}} [opts]
 * @returns {Promise<{canvas: HTMLCanvasElement, cut: object, engine: string}>}
 */
export async function removeBackground(img, { onStage } = {}) {
  const { w: fw, h: fh } = outputSize(img)
  const md = modnetDims(img.width, img.height)
  const errors = []

  const w = getWorker()
  if (w) {
    try {
      const result = await viaWorker(w, pixels(img, md.w, md.h), pixels(img, fw, fh), onStage)
      return { canvas: toCanvas(result), cut: result.cut, engine: 'modnet-worker' }
    } catch (err) {
      errors.push(err)
      console.warn('Worker cut-out failed, trying on the main thread:', err)
    }
  }

  try {
    const result = await modnetHere(pixels(img, md.w, md.h), pixels(img, fw, fh), onStage)
    return { canvas: toCanvas(result), cut: result.cut, engine: 'modnet' }
  } catch (err) {
    errors.push(err)
    console.warn('MODNet unavailable, falling back to MediaPipe:', err)
  }

  const result = await mediapipeHere(img, pixels(img, fw, fh), onStage)
  return { canvas: toCanvas(result), cut: result.cut, engine: 'mediapipe' }
}

/**
 * Start fetching the model before it is needed — called when somebody opens
 * the photo picker, so the download overlaps with them choosing a picture.
 * Safe to call repeatedly and safe to ignore.
 */
export function prewarm() {
  const w = getWorker()
  if (w) w.postMessage({ id: ++seq, warm: true })
}
