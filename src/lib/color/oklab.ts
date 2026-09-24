/** OKLab color: [L, a, b]. Perceptual — Euclidean distance tracks visible difference. */
export type Lab = readonly [number, number, number]

/** sRGB color with 0–255 channels. */
export type Rgb = readonly [number, number, number]

function srgbChannelToLinear(channel8: number): number {
  const c = channel8 / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearToSrgbChannel(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055
  return Math.min(255, Math.max(0, Math.round(c * 255)))
}

// Conversion runs per pixel over ~1M-pixel grids, so the gamma curve is a lookup.
const SRGB_TO_LINEAR = Float64Array.from({ length: 256 }, (_, i) => srgbChannelToLinear(i))

/** Writes the OKLab value of an 8-bit sRGB color into `out[offset..offset+2]` (allocation-free hot path). */
export function rgbToOklabInto(
  r: number,
  g: number,
  b: number,
  out: Float32Array | number[],
  offset: number,
): void {
  const lr = SRGB_TO_LINEAR[r]
  const lg = SRGB_TO_LINEAR[g]
  const lb = SRGB_TO_LINEAR[b]

  // Matrices from Björn Ottosson, "A perceptual color space for image processing" (2020).
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  out[offset] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  out[offset + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  out[offset + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
}

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const out = [0, 0, 0]
  rgbToOklabInto(r, g, b, out, 0)
  return [out[0], out[1], out[2]]
}

/** Converts OKLab back to 8-bit sRGB; out-of-gamut colors are clamped per channel. */
export function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    linearToSrgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

export function labDistance(a: Lab, b: Lab): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
