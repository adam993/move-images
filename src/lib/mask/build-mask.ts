import type { LabImage } from '@/lib/color/lab-image'
import { boxBlur } from './box-blur'
import type { Selection } from './selection'

/** Per-pixel selection weight (0–255), row 0 at the top, plus the mean weight as `coverage` (0–1). */
export type Mask = { width: number; height: number; data: Uint8Array; coverage: number }

// OKLab grids are float32, so a pixel and a target sampled from "the same" color can differ by ~1e-7.
const MATCH_EPSILON = 1e-6

/** Weight of a pixel at OKLab `distance` from the nearest target: 1 inside tolerance, easing to 0 across softness. */
export function selectionWeight(distance: number, tolerance: number, softness: number): number {
  if (softness <= 0) return distance <= tolerance + MATCH_EPSILON ? 1 : 0
  const t = Math.min(1, Math.max(0, (distance - tolerance) / softness))
  return 1 - t * t * (3 - 2 * t)
}

/**
 * Builds a layer's mask from its color selection. `featherPx` is in mask-grid pixels (callers convert
 * from source pixels); it is applied as two box-blur passes of half that radius, which approximates a
 * gaussian edge.
 */
export function buildMask(image: LabImage, selection: Selection, featherPx: number): Mask {
  const { width, height, data } = image
  const pixelCount = width * height
  const { targets, tolerance, softness, invert } = selection
  // Flat copy of target colors: this loop runs ~1M × targets times per rebuild.
  const targetLabs = Float64Array.from(targets.flatMap((target) => target.lab))
  // Beyond this squared distance the weight is 0, so most pixels skip the sqrt and smoothstep.
  const outerSq = (tolerance + Math.max(0, softness) + MATCH_EPSILON) ** 2
  let weights: Float32Array = new Float32Array(pixelCount)

  for (let i = 0; i < pixelCount; i++) {
    let nearestSq = Infinity
    for (let t = 0; t < targetLabs.length; t += 3) {
      const dL = data[i * 3] - targetLabs[t]
      const da = data[i * 3 + 1] - targetLabs[t + 1]
      const db = data[i * 3 + 2] - targetLabs[t + 2]
      const sq = dL * dL + da * da + db * db
      if (sq < nearestSq) nearestSq = sq
    }
    const weight = nearestSq > outerSq ? 0 : selectionWeight(Math.sqrt(nearestSq), tolerance, softness)
    weights[i] = invert ? 1 - weight : weight
  }

  const radius = Math.round(featherPx / 2)
  if (radius > 0) {
    weights = boxBlur(boxBlur(weights, width, height, radius), width, height, radius)
  }

  const out = new Uint8Array(pixelCount)
  let total = 0
  for (let i = 0; i < pixelCount; i++) {
    out[i] = Math.round(weights[i] * 255)
    total += weights[i]
  }
  return { width, height, data: out, coverage: pixelCount === 0 ? 0 : total / pixelCount }
}
