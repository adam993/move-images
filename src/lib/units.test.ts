import { describe, expect, it } from 'vitest'
import { REFERENCE_LONG_SIDE, referenceScale } from './units'

describe('referenceScale', () => {
  it('is the long side relative to the 1000 px reference', () => {
    expect(REFERENCE_LONG_SIDE).toBe(1000)
    expect(referenceScale(2000, 1000)).toBe(2)
    expect(referenceScale(1000, 4032)).toBeCloseTo(4.032, 10)
    expect(referenceScale(500, 250)).toBe(0.5)
  })
})
