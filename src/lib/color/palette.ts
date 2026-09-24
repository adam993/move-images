import { createRandom } from '@/lib/random'
import type { LabImage } from './lab-image'
import { oklabToRgb, rgbToHex, type Lab, type Rgb } from './oklab'

export type PaletteEntry = {
  lab: Lab
  rgb: Rgb
  hex: string
  /** Fraction of the image's pixels assigned to this color (0–1). */
  share: number
  pixelCount: number
}

const MAX_ITERATIONS = 20
const CONVERGENCE_SHIFT = 1e-4

/** Dominant colors via k-means++ in OKLab, sorted by share (largest first). Empty clusters are dropped. */
export function extractPalette(image: LabImage, k: number, seed = 1): PaletteEntry[] {
  const pixelCount = image.width * image.height
  if (pixelCount === 0) throw new Error('Cannot extract a palette from an empty image')
  if (!Number.isInteger(k) || k < 1) throw new Error(`k must be a positive integer, got ${k}`)

  const data = image.data
  const centroids = seedCentroids(data, pixelCount, Math.min(k, pixelCount), createRandom(seed))
  const clusterCount = centroids.length / 3
  const labels = new Int32Array(pixelCount)
  const counts = new Float64Array(clusterCount)
  const sums = new Float64Array(clusterCount * 3)

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    assignLabels(data, pixelCount, centroids, labels)
    counts.fill(0)
    sums.fill(0)
    for (let i = 0; i < pixelCount; i++) {
      const cluster = labels[i]
      counts[cluster]++
      sums[cluster * 3] += data[i * 3]
      sums[cluster * 3 + 1] += data[i * 3 + 1]
      sums[cluster * 3 + 2] += data[i * 3 + 2]
    }

    let maxShift = 0
    for (let c = 0; c < clusterCount; c++) {
      if (counts[c] === 0) continue
      for (let j = 0; j < 3; j++) {
        const next = sums[c * 3 + j] / counts[c]
        maxShift = Math.max(maxShift, Math.abs(next - centroids[c * 3 + j]))
        centroids[c * 3 + j] = next
      }
    }
    if (maxShift < CONVERGENCE_SHIFT) break
  }

  const entries: PaletteEntry[] = []
  for (let c = 0; c < clusterCount; c++) {
    if (counts[c] === 0) continue
    const lab: Lab = [centroids[c * 3], centroids[c * 3 + 1], centroids[c * 3 + 2]]
    const rgb = oklabToRgb(lab)
    entries.push({ lab, rgb, hex: rgbToHex(rgb), share: counts[c] / pixelCount, pixelCount: counts[c] })
  }
  return entries.sort((a, b) => b.pixelCount - a.pixelCount)
}

/**
 * k-means++ seeding: each next centroid is a pixel picked with probability proportional to its squared
 * distance from the nearest centroid so far. Stops early once every pixel coincides with a centroid,
 * so an image with fewer distinct colors than k yields fewer clusters instead of duplicates.
 */
function seedCentroids(
  data: Float32Array,
  pixelCount: number,
  k: number,
  random: () => number,
): Float64Array {
  const chosen: number[] = []
  const nearestSq = new Float64Array(pixelCount).fill(Infinity)
  let next = Math.floor(random() * pixelCount)

  while (true) {
    chosen.push(data[next * 3], data[next * 3 + 1], data[next * 3 + 2])
    if (chosen.length / 3 >= k) break

    let total = 0
    for (let i = 0; i < pixelCount; i++) {
      const dL = data[i * 3] - data[next * 3]
      const da = data[i * 3 + 1] - data[next * 3 + 1]
      const db = data[i * 3 + 2] - data[next * 3 + 2]
      nearestSq[i] = Math.min(nearestSq[i], dL * dL + da * da + db * db)
      total += nearestSq[i]
    }
    if (total === 0) break

    let target = random() * total
    let lastPositive = -1
    next = -1
    for (let i = 0; i < pixelCount; i++) {
      if (nearestSq[i] === 0) continue
      lastPositive = i
      target -= nearestSq[i]
      if (target < 0) {
        next = i
        break
      }
    }
    // Floating-point rounding can leave `target` marginally positive after the last pixel.
    if (next === -1) next = lastPositive
  }
  return Float64Array.from(chosen)
}

function assignLabels(
  data: Float32Array,
  pixelCount: number,
  centroids: Float64Array,
  labels: Int32Array,
): void {
  const clusterCount = centroids.length / 3
  for (let i = 0; i < pixelCount; i++) {
    const L = data[i * 3]
    const a = data[i * 3 + 1]
    const b = data[i * 3 + 2]
    let best = 0
    let bestSq = Infinity
    for (let c = 0; c < clusterCount; c++) {
      const dL = L - centroids[c * 3]
      const da = a - centroids[c * 3 + 1]
      const db = b - centroids[c * 3 + 2]
      const sq = dL * dL + da * da + db * db
      if (sq < bestSq) {
        bestSq = sq
        best = c
      }
    }
    labels[i] = best
  }
}
