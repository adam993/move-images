import { describe, expect, it } from 'vitest'
import { formatPercent } from './format'

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
