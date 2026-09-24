import { describe, expect, it } from 'vitest'
import type { RangeParamSpec } from '@/effects/types'
import { DRIFT_PATTERNS, driftEffect, findMatchingPreset, type DriftParams } from './definition'

const rangeSpecs = driftEffect.params.filter(
  (spec): spec is RangeParamSpec<DriftParams> => spec.kind === 'range',
)
const specFor = (key: keyof DriftParams) => {
  const spec = driftEffect.params.find((candidate) => candidate.key === key)
  if (!spec) throw new Error(`no spec for ${key}`)
  return spec
}

describe('drift presets', () => {
  it.each(driftEffect.presets.map((preset) => [preset.id, preset] as const))(
    '%s keeps every range param inside its spec and on its step grid',
    (_, preset) => {
      for (const spec of rangeSpecs) {
        const value = preset.params[spec.key] as number
        expect(value, spec.key).toBeGreaterThanOrEqual(spec.min)
        expect(value, spec.key).toBeLessThanOrEqual(spec.max)
        const steps = (value - spec.min) / spec.step
        expect(Math.abs(steps - Math.round(steps)), spec.key).toBeLessThan(1e-6)
      }
      expect(DRIFT_PATTERNS).toContain(preset.params.pattern)
    },
  )

  it('has unique ids and defaults equal to the first preset (Gentle water)', () => {
    const ids = driftEffect.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(driftEffect.presets[0].id).toBe('gentle-water')
    expect(driftEffect.defaults).toEqual(driftEffect.presets[0].params)
  })
})

describe('findMatchingPreset', () => {
  it('matches a preset by its exact params and stops matching after an edit', () => {
    const swirl = driftEffect.presets.find((preset) => preset.id === 'swirl')!
    expect(findMatchingPreset({ ...swirl.params })?.id).toBe('swirl')
    expect(findMatchingPreset({ ...swirl.params, amplitude: swirl.params.amplitude + 0.1 })).toBeUndefined()
  })
})

describe('param visibility', () => {
  const base = driftEffect.defaults
  const visible = (key: keyof DriftParams, params: DriftParams) =>
    specFor(key).visibleWhen?.(params) ?? true

  it('shows direction only for the wave pattern', () => {
    expect(visible('direction', { ...base, pattern: 'wave' })).toBe(true)
    expect(visible('direction', { ...base, pattern: 'orbit' })).toBe(false)
  })

  it('shows the center only for the pulse pattern', () => {
    expect(visible('centerX', { ...base, pattern: 'pulse' })).toBe(true)
    expect(visible('centerY', { ...base, pattern: 'pulse' })).toBe(true)
    expect(visible('centerX', { ...base, pattern: 'turbulence' })).toBe(false)
  })

  it('always shows amplitude, scale, speed and phase', () => {
    for (const pattern of DRIFT_PATTERNS) {
      for (const key of ['amplitude', 'scale', 'speed', 'phase'] as const) {
        expect(visible(key, { ...base, pattern })).toBe(true)
      }
    }
  })
})
