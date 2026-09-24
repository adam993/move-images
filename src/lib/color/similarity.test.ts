import { describe, expect, it } from 'vitest'
import { BLUE, GREEN, RED, labImageFromPixels, run } from '@/test/synthetic-image'
import { rgbToOklab } from './oklab'
import { extractPalette } from './palette'
import { nearestPaletteIndex, similarShare } from './similarity'

const image = labImageFromPixels([...run(RED, 50), ...run(GREEN, 30), ...run(BLUE, 20)], 10, 10)

describe('similarShare', () => {
  it('counts the fraction of pixels within the tolerance of a color', () => {
    const red = rgbToOklab(...RED)
    expect(similarShare(image, red, 0.01)).toBe(0.5)
    expect(similarShare(image, red, 2)).toBe(1)
  })

  it('includes near-identical shades within a small tolerance', () => {
    const nearRed = rgbToOklab(250, 5, 5)
    expect(similarShare(image, nearRed, 0.05)).toBe(0.5)
    expect(similarShare(image, nearRed, 0)).toBe(0)
  })
})

describe('nearestPaletteIndex', () => {
  it('returns the index of the closest palette entry', () => {
    const palette = extractPalette(image, 3)
    expect(nearestPaletteIndex(palette, rgbToOklab(10, 240, 20))).toBe(1)
    expect(nearestPaletteIndex(palette, rgbToOklab(20, 10, 230))).toBe(2)
  })

  it('returns -1 for an empty palette', () => {
    expect(nearestPaletteIndex([], rgbToOklab(0, 0, 0))).toBe(-1)
  })
})
