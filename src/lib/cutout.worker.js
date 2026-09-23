/**
 * The cut-out, off the main thread.
 *
 * Matting a photograph is a few seconds of solid arithmetic on a phone. On the
 * main thread that freezes the page — the spinner stops, taps do nothing, and
 * people assume it has crashed and reload. In here the page stays alive and
 * can say what is happening.
 *
 * Messages in:  { id, small: {data,w,h}, full: {data,w,h} }   (buffers transferred)
 *               { id, warm: true }                            (load the model early)
 * Messages out: { id, stage }                                  progress
 *               { id, result: {data,w,h,cut,frac,box} }        (buffer transferred)
 *               { id, error }
 */
import { runModnet, modnetSession } from './modnet'
import { detachThinNecks, keepMainSubject, suppressDetachedHaze, guidedUpsample, finishCutout } from './matting'

self.onmessage = async (e) => {
  const { id, warm, small, full } = e.data || {}
  try {
    if (warm) {
      await modnetSession()
      self.postMessage({ id, ready: true })
      return
    }
    self.postMessage({ id, stage: 'model' })
    await modnetSession()

    self.postMessage({ id, stage: 'matting' })
    const low = await runModnet(small.data, small.w, small.h)

    // Isolation and haze work on the model's own grid: cheap, and the
    // decisions they make are about regions, not edges.
    keepMainSubject(low, small.w, small.h)
    // A bystander's hand on a shoulder is connected to the subject; part it
    // at the narrow join, then drop whatever that left floating.
    detachThinNecks(low, small.w, small.h)
    keepMainSubject(low, small.w, small.h)
    suppressDetachedHaze(low, small.w, small.h, 6, 22)

    self.postMessage({ id, stage: 'refining' })
    const alpha = guidedUpsample(low, small.data, small.w, small.h, full.data, full.w, full.h)

    self.postMessage({ id, stage: 'finishing' })
    const result = finishCutout(full.data, alpha, full.w, full.h)
    self.postMessage({ id, result }, [result.data.buffer])
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) })
  }
}
