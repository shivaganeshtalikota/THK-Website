/**
 * Finding faces, so the cut-out knows WHO the photograph is of.
 *
 * Portrait matting segments people, all of them. Which person a supporter
 * means is obvious to a human — the one the photo is of, whose face is
 * biggest and nearest the middle — and a face detector lets the pipeline see
 * the same thing: the matte keeps the person that face belongs to, and the
 * poster sizes and places people by their face rather than by however tightly
 * the photo happens to be cropped.
 *
 * The detector is UltraFace (version-RFB-320, MIT licence, from the ONNX model
 * zoo; ~1.2MB). It runs on the same ONNX runtime as MODNet, so it adds no
 * second runtime to the download. Input is a fixed 320x240 RGB image
 * normalised to (x - 127) / 128; output is per-anchor face probabilities and
 * boxes already decoded to 0..1 coordinates, so only non-maximum suppression
 * is left to do here.
 */
import * as ort from 'onnxruntime-web/wasm'
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

export const FACE_W = 320
export const FACE_H = 240
const MODEL_URL = '/vision/ultraface-320.onnx'

ort.env.wasm.wasmPaths = { wasm: wasmUrl }
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
// Warnings only clutter the console of every visitor; errors still surface.
ort.env.logLevel = 'error'

let sessionPromise = null
function faceSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    }).catch((err) => {
      sessionPromise = null
      throw err
    })
  }
  return sessionPromise
}

function iou(a, b) {
  const x1 = Math.max(a.x1, b.x1)
  const y1 = Math.max(a.y1, b.y1)
  const x2 = Math.min(a.x2, b.x2)
  const y2 = Math.min(a.y2, b.y2)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const area = (f) => (f.x2 - f.x1) * (f.y2 - f.y1)
  return inter / (area(a) + area(b) - inter + 1e-9)
}

/**
 * Faces in an RGBA image that is exactly FACE_W x FACE_H (the whole photo,
 * stretched — the detector was trained that way). Returns boxes in 0..1
 * coordinates of the photograph, most confident first. Never throws: a photo
 * where no face can be found is still a photo, and the cut-out carries on
 * without one.
 */
export async function detectFaces(rgba) {
  try {
    const session = await faceSession()
    const n = FACE_W * FACE_H
    const input = new Float32Array(3 * n)
    for (let i = 0, j = 0; i < n; i += 1, j += 4) {
      input[i] = (rgba[j] - 127) / 128
      input[i + n] = (rgba[j + 1] - 127) / 128
      input[i + 2 * n] = (rgba[j + 2] - 127) / 128
    }
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, FACE_H, FACE_W]) })
    const scores = out.scores.data
    const boxes = out.boxes.data
    const found = []
    for (let i = 0; i < scores.length / 2; i += 1) {
      const p = scores[i * 2 + 1]
      // 0.8, not the usual 0.7: at 0.7 a patch of skin at the edge of a rally
      // photo occasionally scored as a face.
      if (p < 0.8) continue
      found.push({
        score: p,
        x1: Math.max(0, boxes[i * 4]),
        y1: Math.max(0, boxes[i * 4 + 1]),
        x2: Math.min(1, boxes[i * 4 + 2]),
        y2: Math.min(1, boxes[i * 4 + 3]),
      })
    }
    found.sort((a, b) => b.score - a.score)
    const kept = []
    for (const f of found) if (kept.every((k) => iou(k, f) < 0.3)) kept.push(f)
    return kept
  } catch (err) {
    console.warn('Face detection unavailable:', err)
    return []
  }
}

/**
 * The face the photograph is OF: the biggest, favouring the middle. A face
 * less than a third the size of the biggest is a bystander however central.
 */
export function mainFace(faces) {
  if (!faces?.length) return null
  const area = (f) => (f.x2 - f.x1) * (f.y2 - f.y1)
  const biggest = Math.max(...faces.map(area))
  let best = null
  let bestScore = -1
  for (const f of faces) {
    if (area(f) < biggest / 3) continue
    const cx = (f.x1 + f.x2) / 2
    const s = area(f) * (0.7 + 0.3 * (1 - Math.abs(cx - 0.5) * 2))
    if (s > bestScore) {
      bestScore = s
      best = f
    }
  }
  return best
}
