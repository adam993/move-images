import { GIFEncoder, applyPalette } from 'gifenc'
import type { EncodeOptions } from './encode-options'
import { buildGlobalPalette, paletteSampleIndices } from './gif-palette'
import { gifFrameDelays } from './gif-timing'
import { yieldToBrowser } from './yield-to-browser'

const MAX_GIF_COLORS = 256

/** Encodes `frameCount` frames (top-down RGBA from `readFrame`) into a looping GIF with one global palette. */
export async function encodeGif(
  readFrame: (index: number) => Uint8ClampedArray,
  options: EncodeOptions & { width: number; height: number },
): Promise<Blob> {
  const { width, height, fps, frameCount, signal, onProgress } = options
  const palette = buildGlobalPalette(paletteSampleIndices(frameCount).map(readFrame), MAX_GIF_COLORS)
  const delays = gifFrameDelays(frameCount, fps)
  const gif = GIFEncoder()

  for (let index = 0; index < frameCount; index++) {
    signal.throwIfAborted()
    const indexed = applyPalette(readFrame(index), palette)
    // The first frame carries the global palette and the loop-forever flag; later frames reuse them.
    const first = index === 0
    gif.writeFrame(indexed, width, height, {
      palette: first ? palette : undefined,
      repeat: first ? 0 : undefined,
      delay: delays[index],
    })
    onProgress((index + 1) / frameCount)
    await yieldToBrowser()
  }

  gif.finish()
  return new Blob([gif.bytes()], { type: 'image/gif' })
}
