const GIF_DELAY_UNIT_MS = 10

/**
 * Per-frame GIF delays in ms. GIF stores delays in 10 ms units, so rounding every frame the same way would
 * drift (15 fps → 70 ms × 60 = 4.2 s). Rounding each frame's cumulative end time keeps the total exact.
 */
export function gifFrameDelays(frameCount: number, fps: number): number[] {
  if (frameCount < 1) throw new Error(`A GIF needs at least one frame, got ${frameCount}`)
  const endOfFrame = (i: number) => Math.round((i * 1000) / fps / GIF_DELAY_UNIT_MS) * GIF_DELAY_UNIT_MS
  return Array.from({ length: frameCount }, (_, i) => endOfFrame(i + 1) - endOfFrame(i))
}
