import { describe, expect, it } from 'vitest'
import { labDistance, oklabToRgb, rgbToHex, rgbToOklab, type Lab } from './oklab'

function expectLab(actual: Lab, expected: [number, number, number]) {
  expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, 4))
}

describe('rgbToOklab', () => {
  it('converts white, black and sRGB red to reference OKLab values', () => {
    expectLab(rgbToOklab(255, 255, 255), [1, 0, 0])
    expectLab(rgbToOklab(0, 0, 0), [0, 0, 0])
    expectLab(rgbToOklab(255, 0, 0), [0.62796, 0.22486, 0.12585])
  })
})

describe('oklabToRgb', () => {
  it('round-trips sRGB colors through OKLab', () => {
    const colors = [
      [12, 200, 99],
      [255, 128, 0],
      [30, 30, 30],
      [0, 0, 255],
    ] as const
    for (const rgb of colors) {
      expect(oklabToRgb(rgbToOklab(rgb[0], rgb[1], rgb[2]))).toEqual(rgb)
    }
  })

  it('clamps out-of-gamut colors into 0–255', () => {
    const rgb = oklabToRgb([0.9, 0.4, 0.4])
    for (const channel of rgb) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(255)
    }
  })
})

describe('labDistance', () => {
  it('is zero for equal colors and symmetric otherwise', () => {
    const red = rgbToOklab(255, 0, 0)
    const blue = rgbToOklab(0, 0, 255)
    expect(labDistance(red, red)).toBe(0)
    expect(labDistance(red, blue)).toBeCloseTo(labDistance(blue, red), 10)
    expect(labDistance(red, blue)).toBeGreaterThan(0.3)
  })
})

describe('rgbToHex', () => {
  it('formats channels as lowercase #rrggbb', () => {
    expect(rgbToHex([255, 0, 16])).toBe('#ff0010')
  })
})
