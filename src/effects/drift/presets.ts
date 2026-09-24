import type { EffectPreset } from '@/effects/types'
import type { DriftParams } from './definition'

// Params a preset's pattern ignores still need values; these are the neutral ones.
const UNUSED = { centerX: 0.5, centerY: 0.5, rate: 8 }

/** Motion-only presets: applying one keeps the layer's color selection. The first is the default. */
export const DRIFT_PRESETS: readonly EffectPreset<DriftParams>[] = [
  {
    id: 'gentle-water',
    label: 'Gentle water',
    params: { pattern: 'wave', amplitude: 2.5, scale: 60, speed: 0.35, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'rising-drift',
    label: 'Rising drift',
    params: { pattern: 'wave', amplitude: 2, scale: 80, speed: 0.3, direction: 90, phase: 0, ...UNUSED },
  },
  {
    id: 'wind-foliage',
    label: 'Wind in foliage',
    params: { pattern: 'turbulence', amplitude: 3, scale: 90, speed: 0.25, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'heat-shimmer',
    label: 'Heat shimmer',
    params: { pattern: 'turbulence', amplitude: 1.2, scale: 18, speed: 1.2, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'breathing',
    label: 'Breathing',
    params: { pattern: 'pulse', amplitude: 3, scale: 400, speed: 0.2, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'swirl',
    label: 'Swirl',
    params: { pattern: 'orbit', amplitude: 2, scale: 120, speed: 0.4, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'digital-glitch',
    label: 'Digital glitch',
    params: { pattern: 'glitch', amplitude: 10, scale: 20, speed: 0.35, direction: 0, phase: 0, ...UNUSED },
  },
  {
    id: 'nervous-jitter',
    label: 'Nervous jitter',
    params: { pattern: 'jitter', amplitude: 2.5, scale: 60, speed: 0.35, direction: 0, phase: 0, ...UNUSED, rate: 12 },
  },
]
