import { describe, expect, it } from 'vitest'
import { fitWithin } from './fit-within'

describe('fitWithin', () => {
  it('leaves images that already fit untouched (never upscales)', () => {
    expect(fitWithin(1000, 800, 4096)).toEqual({ width: 1000, height: 800 })
  })

  it('scales a huge landscape photo so its long side equals the limit', () => {
    expect(fitWithin(8000, 6000, 4096)).toEqual({ width: 4096, height: 3072 })
  })

  it('scales a tall image by its height', () => {
    expect(fitWithin(3000, 9000, 4096)).toEqual({ width: 1365, height: 4096 })
  })

  it('never returns a zero dimension for extreme aspect ratios', () => {
    expect(fitWithin(10000, 1, 4096)).toEqual({ width: 4096, height: 1 })
  })

  it('rejects non-positive dimensions', () => {
    expect(() => fitWithin(0, 10, 4096)).toThrow(/positive/)
    expect(() => fitWithin(10, 10, 0)).toThrow(/positive/)
  })
})
