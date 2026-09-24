import { describe, expect, it } from 'vitest'
import { formatBytes, formatPercent, formatStepValue } from './format'

describe('formatPercent', () => {
  it('shows one decimal for ordinary shares', () => {
    expect(formatPercent(0.5)).toBe('50.0%')
    expect(formatPercent(0.1234)).toBe('12.3%')
  })

  it('shows exact zero and full coverage without decimals', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(1)).toBe('100%')
  })

  it('marks tiny but non-zero shares instead of rounding them to 0.0%', () => {
    expect(formatPercent(0.0004)).toBe('<0.1%')
  })
})

describe('formatStepValue', () => {
  it('shows as many decimals as the slider step has', () => {
    expect(formatStepValue(2.5, 0.1)).toBe('2.5')
    expect(formatStepValue(0.35, 0.01)).toBe('0.35')
    expect(formatStepValue(0.1, 0.005)).toBe('0.100')
    expect(formatStepValue(60, 1)).toBe('60')
  })
})

describe('formatBytes', () => {
  it('uses B, KB and MB with one decimal above bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(12_600)).toBe('12.3 KB')
    expect(formatBytes(3_250_000)).toBe('3.1 MB')
  })
})
