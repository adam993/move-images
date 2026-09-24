/** Largest integer size with the same aspect ratio whose long side is at most `maxSide`. Never upscales. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxSide <= 0) {
    throw new Error(`fitWithin needs positive sizes, got ${width}×${height} within ${maxSide}`)
  }
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
