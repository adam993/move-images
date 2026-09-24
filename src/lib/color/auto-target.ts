import type { PaletteEntry } from './palette'

// Rarer colors are usually specks; moving them would be invisible.
const MIN_SHARE = 0.03

const chroma = (entry: PaletteEntry) => Math.hypot(entry.lab[1], entry.lab[2])

/**
 * The color to select automatically when an image loads: the most colorful palette entry that covers a
 * visible part of the image. The largest entry is often a white or black background, where motion shows least.
 */
export function pickAutoTarget(palette: readonly PaletteEntry[]): PaletteEntry | undefined {
  const visible = palette.filter((entry) => entry.share >= MIN_SHARE)
  const candidates = visible.length > 0 ? visible : palette
  return candidates.reduce<PaletteEntry | undefined>(
    (best, entry) => (!best || chroma(entry) > chroma(best) ? entry : best),
    undefined,
  )
}
