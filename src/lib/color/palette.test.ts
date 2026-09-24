import { describe, expect, it } from 'vitest'
import { BLUE, GREEN, RED, labImageFromPixels, run } from '@/test/synthetic-image'
import { extractPalette } from './palette'

const threeColors = labImageFromPixels([...run(RED, 50), ...run(GREEN, 30), ...run(BLUE, 20)], 10, 10)

describe('extractPalette', () => {
  it('finds each color with its share of pixels, largest first', () => {
    const palette = extractPalette(threeColors, 3)
    expect(palette.map((entry) => entry.hex)).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    expect(palette.map((entry) => entry.share)).toEqual([0.5, 0.3, 0.2])
    expect(palette.map((entry) => entry.pixelCount)).toEqual([50, 30, 20])
  })

  it('drops empty clusters when k exceeds the number of distinct colors', () => {
    const palette = extractPalette(threeColors, 12)
    expect(palette).toHaveLength(3)
    expect(palette.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1, 10)
    expect(palette.every((entry) => entry.lab.every(Number.isFinite))).toBe(true)
  })

  it('returns a single full-share entry for a flat image', () => {
    const flat = labImageFromPixels(run([40, 90, 200], 16), 4, 4)
    const palette = extractPalette(flat, 8)
    expect(palette).toHaveLength(1)
    expect(palette[0].share).toBe(1)
    expect(palette[0].hex).toBe('#285ac8')
  })

  it('is deterministic for a given seed', () => {
    const gradient = labImageFromPixels(
      Array.from({ length: 256 }, (_, i) => [i, (i * 7) % 256, 255 - i] as const),
      16,
      16,
    )
    expect(extractPalette(gradient, 6, 7)).toEqual(extractPalette(gradient, 6, 7))
  })

  it('rejects an empty image and a non-positive k', () => {
    expect(() => extractPalette({ width: 0, height: 0, data: new Float32Array() }, 4)).toThrow(/empty/)
    expect(() => extractPalette(threeColors, 0)).toThrow(/k must be/)
  })
})
