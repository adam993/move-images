import { describe, expect, it } from 'vitest'
import { gifFrameDelays } from './gif-timing'

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0)

describe('gifFrameDelays', () => {
  it('alternates 70/60 ms at 15 fps so 60 frames last exactly 4 s', () => {
    const delays = gifFrameDelays(60, 15)
    expect(delays).toHaveLength(60)
    expect(sum(delays)).toBe(4000)
    expect(delays.every((d) => d === 60 || d === 70)).toBe(true)
  })

  it('uses exact delays where the frame time is a multiple of 10 ms', () => {
    expect(new Set(gifFrameDelays(40, 20))).toEqual(new Set([50]))
    expect(new Set(gifFrameDelays(40, 25))).toEqual(new Set([40]))
    expect(new Set(gifFrameDelays(10, 10))).toEqual(new Set([100]))
  })

  it('rejects an empty animation', () => {
    expect(() => gifFrameDelays(0, 15)).toThrow(/at least one frame/)
  })
})
