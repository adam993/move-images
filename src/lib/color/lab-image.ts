import { rgbToOklabInto, type Lab } from './oklab'

/** An image grid in OKLab: `data` holds L, a, b interleaved, row-major, row 0 at the top. */
export type LabImage = { width: number; height: number; data: Float32Array }

export function labImageFromRgba(rgba: Uint8ClampedArray, width: number, height: number): LabImage {
  const pixelCount = width * height
  if (rgba.length !== pixelCount * 4) {
    throw new Error(
      `RGBA buffer has ${rgba.length} bytes, expected ${pixelCount * 4} for ${width}×${height}`,
    )
  }

  const data = new Float32Array(pixelCount * 3)
  for (let i = 0; i < pixelCount; i++) {
    rgbToOklabInto(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], data, i * 3)
  }
  return { width, height, data }
}

export function labAt(image: LabImage, x: number, y: number): Lab {
  const cx = Math.min(image.width - 1, Math.max(0, Math.floor(x)))
  const cy = Math.min(image.height - 1, Math.max(0, Math.floor(y)))
  const offset = (cy * image.width + cx) * 3
  return [image.data[offset], image.data[offset + 1], image.data[offset + 2]]
}
