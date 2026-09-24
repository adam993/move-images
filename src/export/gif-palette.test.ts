import { describe, expect, it } from 'vitest'
import { buildGlobalPalette } from './gif-palette'

function flatFrame([r, g, b]: [number, number, number], pixels = 16): Uint8ClampedArray {
  const frame = new Uint8ClampedArray(pixels * 4)
  for (let i = 0; i < pixels; i++) frame.set([r, g, b, 255], i * 4)
  return frame
}

const hasColorNear = (palette: number[][], [r, g, b]: number[]) =>
  palette.some(([pr, pg, pb]) => Math.abs(pr - r) <= 8 && Math.abs(pg - g) <= 8 && Math.abs(pb - b) <= 8)

const red = [255, 0, 0] as [number, number, number]
const green = [0, 255, 0] as [number, number, number]
const blue = [0, 0, 255] as [number, number, number]

describe('buildGlobalPalette', () => {
  it('contains the colors of every sampled frame', () => {
    const palette = buildGlobalPalette([flatFrame(red), flatFrame(green), flatFrame(blue)], 256)
    for (const color of [red, green, blue]) expect(hasColorNear(palette, color), String(color)).toBe(true)
  })

  it('returns at most maxColors entries', () => {
    const palette = buildGlobalPalette([flatFrame(red), flatFrame(green), flatFrame(blue)], 2)
    expect(palette.length).toBeLessThanOrEqual(2)
  })

  it('subsamples large inputs but still sees every frame', () => {
    const palette = buildGlobalPalette([flatFrame(red), flatFrame(green), flatFrame(blue)], 256, 10)
    for (const color of [red, green, blue]) expect(hasColorNear(palette, color), String(color)).toBe(true)
  })

  it('rejects an empty frame list', () => {
    expect(() => buildGlobalPalette([], 256)).toThrow(/at least one frame/)
  })
})
