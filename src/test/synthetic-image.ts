import { labImageFromRgba, type LabImage } from '@/lib/color/lab-image'
import type { Rgb } from '@/lib/color/oklab'

/** Builds a width×height LabImage from `pixels` (row-major, length must equal width × height). */
export function labImageFromPixels(pixels: readonly Rgb[], width: number, height: number): LabImage {
  const rgba = new Uint8ClampedArray(pixels.length * 4)
  pixels.forEach(([r, g, b], i) => rgba.set([r, g, b, 255], i * 4))
  return labImageFromRgba(rgba, width, height)
}

/** Repeats `color` `count` times — for composing images with known color shares. */
export function run(color: Rgb, count: number): Rgb[] {
  return Array.from({ length: count }, () => color)
}

export const RED: Rgb = [255, 0, 0]
export const GREEN: Rgb = [0, 255, 0]
export const BLUE: Rgb = [0, 0, 255]
