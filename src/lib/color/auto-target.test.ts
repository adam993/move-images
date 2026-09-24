import { describe, expect, it } from 'vitest'
import { oklabToRgb, rgbToHex, rgbToOklab, type Rgb } from './oklab'
import type { PaletteEntry } from './palette'
import { pickAutoTarget } from './auto-target'

function entry(rgb: Rgb, share: number): PaletteEntry {
  const lab = rgbToOklab(...rgb)
  return { lab, rgb: oklabToRgb(lab), hex: rgbToHex(rgb), share, pixelCount: Math.round(share * 1000) }
}

describe('pickAutoTarget', () => {
  it('picks the most colorful color among those covering at least 3% of the image', () => {
    const palette = [
      entry([240, 240, 240], 0.5), // background white: largest but colorless
      entry([150, 140, 130], 0.28), // muted
      entry([30, 110, 220], 0.2), // vivid blue: the pick
      entry([255, 0, 200], 0.02), // most vivid, but too rare to show
    ]
    expect(pickAutoTarget(palette)?.hex).toBe('#1e6edc')
  })

  it('still picks something in a colorless image', () => {
    const palette = [entry([20, 20, 20], 0.6), entry([200, 198, 202], 0.4)]
    expect(pickAutoTarget(palette)).toBeDefined()
  })

  it('returns undefined for an empty palette', () => {
    expect(pickAutoTarget([])).toBeUndefined()
  })
})
