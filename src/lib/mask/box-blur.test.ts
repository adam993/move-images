import { describe, expect, it } from 'vitest'
import { boxBlur } from './box-blur'

const sum = (values: Float32Array) => values.reduce((total, v) => total + v, 0)

describe('boxBlur', () => {
  it('returns an unchanged copy for radius 0', () => {
    const src = Float32Array.from([0, 1, 0.5, 0.25])
    const out = boxBlur(src, 2, 2, 0)
    expect(out).toEqual(src)
    expect(out).not.toBe(src)
  })

  it('keeps a constant image constant, including at the edges', () => {
    const src = new Float32Array(5 * 4).fill(0.7)
    boxBlur(src, 5, 4, 2).forEach((v) => expect(v).toBeCloseTo(0.7, 6))
  })

  it('spreads an interior impulse over the box while preserving its total', () => {
    const src = new Float32Array(9 * 9)
    src[4 * 9 + 4] = 1
    const out = boxBlur(src, 9, 9, 1)
    expect(sum(out)).toBeCloseTo(1, 6)
    expect(out[4 * 9 + 4]).toBeCloseTo(1 / 9, 6)
    expect(out[3 * 9 + 3]).toBeCloseTo(1 / 9, 6)
    expect(out[2 * 9 + 2]).toBe(0)
  })

  it('rejects a negative or fractional radius', () => {
    expect(() => boxBlur(new Float32Array(4), 2, 2, -1)).toThrow(/radius/)
    expect(() => boxBlur(new Float32Array(4), 2, 2, 1.5)).toThrow(/radius/)
  })
})
