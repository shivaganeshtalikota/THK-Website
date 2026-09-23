/**
 * MODNet portrait matting, run with ONNX Runtime Web.
 *
 * WHY MODNET
 * The earlier cut-out used MediaPipe's selfie segmenter, which answers "is this
 * pixel a person?" on a 256x256 grid and leaves the hairline to post-processing.
 * MODNet is a MATTING model: it predicts how opaque each pixel is, which is
 * what hair actually needs. Benchmarked on the same photographs the office
 * complained about, it removed the leftover background the old pipeline left
 * beside people and kept loose hair the old one clipped. Apache-2.0.
 *
 * WHICH BUILD OF IT
 * The widely circulated 8-bit build was tried first and rejected: its
 * activations are quantised too, and on a photograph of two men in white and
 * cream it punched holes through both shirts (22% of pixels off by more than
 * half against the full-precision model). The file shipped here keeps the
 * weights in int8 — a quarter of the download — but dequantises them once at
 * load, so it computes in full precision: 0.1% of pixels differ from the
 * 25MB original, at 8.9MB.
 *
 * Single-threaded on purpose: threads need cross-origin isolation, which this
 * site does not have, and one thread in a worker keeps the page responsive
 * anyway.
 */
import * as ort from 'onnxruntime-web/wasm'
// The runtime's WebAssembly, as a URL Vite fingerprints and serves from
// /assets. Imported from the installed package, so the binary is always the
// exact build this JavaScript was compiled against — a mismatch between the
// two fails at load — and its hashed name makes it safe to cache forever.
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

export const MODNET_URL = '/vision/modnet-w8.onnx'

ort.env.wasm.wasmPaths = { wasm: wasmUrl }
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
// Warnings only clutter the console of every visitor; errors still surface.
ort.env.logLevel = 'error'

let sessionPromise = null

export function modnetSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODNET_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    }).catch((err) => {
      sessionPromise = null
      throw err
    })
  }
  return sessionPromise
}

/**
 * RGBA at modnetDims() -> alpha in 0..1, same size.
 * Normalisation is MODNet's own: (x / 127.5) - 1, NCHW.
 */
export async function runModnet(rgba, w, h) {
  const session = await modnetSession()
  const n = w * h
  const input = new Float32Array(3 * n)
  for (let i = 0, j = 0; i < n; i += 1, j += 4) {
    input[i] = rgba[j] / 127.5 - 1
    input[i + n] = rgba[j + 1] / 127.5 - 1
    input[i + 2 * n] = rgba[j + 2] / 127.5 - 1
  }
  const feeds = { [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, h, w]) }
  const out = await session.run(feeds)
  const alpha = out[session.outputNames[0]].data
  return Float32Array.from(alpha)
}
