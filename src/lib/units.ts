/**
 * Effect distances (amplitude, scale, feather) are "reference px": pixels on an image whose long side is
 * 1000 px. Converting by the real long side makes a preset look the same on a 1000 px painting and a
 * 4032 px phone photo, and in exports at any output size.
 */
export const REFERENCE_LONG_SIDE = 1000

/** Multiply reference px by this to get pixels of a width × height grid. */
export function referenceScale(width: number, height: number): number {
  return Math.max(width, height) / REFERENCE_LONG_SIDE
}
