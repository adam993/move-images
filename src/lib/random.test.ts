import { describe, expect, it } from 'vitest'
import { createRandom } from './random'

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const first = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(first)
  })

  it('produces different sequences for different seeds, all in [0, 1)', () => {
    const a = createRandom(1)
    const b = createRandom(2)
    const values = Array.from({ length: 1000 }, () => a())
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
    expect(b()).not.toBe(createRandom(1)())
  })
})
