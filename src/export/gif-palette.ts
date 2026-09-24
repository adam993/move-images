import { quantize, type GifPalette } from 'gifenc'

const DEFAULT_MAX_PIXELS = 400_000

/**
 * One palette for the whole GIF, quantized from pixels of several frames. Per-frame palettes would make
 * colors flicker between frames; a drift animation moves pixels without inventing new colors, so a few
 * sampled frames cover what every frame needs. Large inputs are subsampled evenly to bound the cost.
 */
export function buildGlobalPalette(
  frames: readonly Uint8ClampedArray[],
  maxColors: number,
  maxPixels = DEFAULT_MAX_PIXELS,
): GifPalette {
  if (frames.length === 0) throw new Error('A GIF palette needs at least one frame')

  const totalPixels = frames.reduce((sum, frame) => sum + frame.length / 4, 0)
  const stride = Math.max(1, Math.ceil(totalPixels / maxPixels))
  const sampled = new Uint8ClampedArray(Math.ceil(totalPixels / stride) * 4)

  let written = 0
  let globalIndex = 0
  for (const frame of frames) {
    const pixelCount = frame.length / 4
    // Continue the stride across frame boundaries so every frame contributes proportionally.
    let i = (stride - (globalIndex % stride)) % stride
    for (; i < pixelCount; i += stride) {
      sampled.set(frame.subarray(i * 4, i * 4 + 4), written * 4)
      written++
    }
    globalIndex += pixelCount
  }
  return quantize(sampled.subarray(0, written * 4), maxColors)
}
