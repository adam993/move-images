import { describe, expect, it } from 'vitest'
import { rgbToOklab } from '@/lib/color/oklab'
import { BLUE, RED, labImageFromPixels, run } from '@/test/synthetic-image'
import { buildMask, selectionWeight } from './build-mask'
import type { Selection } from './selection'

const redTarget = { lab: rgbToOklab(...RED), hex: '#ff0000' }
const redBlue = labImageFromPixels([RED, BLUE], 2, 1)

function selection(overrides: Partial<Selection> = {}): Selection {
  return { targets: [redTarget], tolerance: 0.1, softness: 0.05, feather: 0, invert: false, ...overrides }
}

describe('selectionWeight', () => {
  it('is 1 within tolerance, 0 beyond tolerance + softness, and eases between', () => {
    expect(selectionWeight(0.05, 0.1, 0.05)).toBe(1)
    expect(selectionWeight(0.2, 0.1, 0.05)).toBe(0)
    expect(selectionWeight(0.125, 0.1, 0.05)).toBeCloseTo(0.5, 6)
  })

  it('is a hard threshold when softness is 0 (no NaN from equal smoothstep edges)', () => {
    expect(selectionWeight(0.1, 0.1, 0)).toBe(1)
    expect(selectionWeight(0.11, 0.1, 0)).toBe(0)
  })
})

describe('buildMask', () => {
  it('selects pixels matching a target and reports coverage', () => {
    const mask = buildMask(redBlue, selection(), 0)
    expect(Array.from(mask.data)).toEqual([255, 0])
    expect(mask.coverage).toBeCloseTo(0.5, 6)
    expect([mask.width, mask.height]).toEqual([2, 1])
  })

  it('selects nothing without targets, and everything when that is inverted', () => {
    expect(Array.from(buildMask(redBlue, selection({ targets: [] }), 0).data)).toEqual([0, 0])
    const inverted = buildMask(redBlue, selection({ targets: [], invert: true }), 0)
    expect(Array.from(inverted.data)).toEqual([255, 255])
    expect(inverted.coverage).toBe(1)
  })

  it('inverts a targeted selection', () => {
    expect(Array.from(buildMask(redBlue, selection({ invert: true }), 0).data)).toEqual([0, 255])
  })

  it('still selects exact matches at tolerance 0 despite float32 storage', () => {
    const mask = buildMask(redBlue, selection({ tolerance: 0, softness: 0 }), 0)
    expect(Array.from(mask.data)).toEqual([255, 0])
  })

  it('selects a pixel close to any of several targets', () => {
    const blueTarget = { lab: rgbToOklab(...BLUE), hex: '#0000ff' }
    const mask = buildMask(redBlue, selection({ targets: [redTarget, blueTarget] }), 0)
    expect(Array.from(mask.data)).toEqual([255, 255])
  })

  it('feathers the selection edge without changing coverage much', () => {
    const strip = labImageFromPixels([...run(RED, 4), ...run(BLUE, 5)], 9, 1)
    const hard = buildMask(strip, selection(), 0)
    const soft = buildMask(strip, selection(), 4)
    expect(soft.data[3]).toBeLessThan(255)
    expect(soft.data[4]).toBeGreaterThan(0)
    expect(soft.coverage).toBeCloseTo(hard.coverage, 1)
  })
})
