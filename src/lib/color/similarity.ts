import type { LabImage } from './lab-image'
import type { Lab } from './oklab'
import type { PaletteEntry } from './palette'

/** Fraction (0–1) of the image's pixels whose OKLab distance to `target` is at most `tolerance`. */
export function similarShare(image: LabImage, target: Lab, tolerance: number): number {
  const pixelCount = image.width * image.height
  if (pixelCount === 0) throw new Error('Cannot measure color share in an empty image')

  const toleranceSq = tolerance * tolerance
  const data = image.data
  let matches = 0
  for (let i = 0; i < pixelCount; i++) {
    const dL = data[i * 3] - target[0]
    const da = data[i * 3 + 1] - target[1]
    const db = data[i * 3 + 2] - target[2]
    if (dL * dL + da * da + db * db <= toleranceSq) matches++
  }
  return matches / pixelCount
}

/** Index of the palette entry closest to `lab`, or -1 when the palette is empty. */
export function nearestPaletteIndex(palette: readonly PaletteEntry[], lab: Lab): number {
  let best = -1
  let bestSq = Infinity
  palette.forEach((entry, index) => {
    const dL = entry.lab[0] - lab[0]
    const da = entry.lab[1] - lab[1]
    const db = entry.lab[2] - lab[2]
    const sq = dL * dL + da * da + db * db
    if (sq < bestSq) {
      bestSq = sq
      best = index
    }
  })
  return best
}
