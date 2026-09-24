import type { EffectDefinition, EffectPreset, ParamSpec } from '@/effects/types'
import { DRIFT_PRESETS } from './presets'

export const DRIFT_PATTERNS = ['wave', 'orbit', 'pulse', 'turbulence', 'glitch', 'jitter'] as const
export type DriftPattern = (typeof DRIFT_PATTERNS)[number]

/** Drift displaces selected pixels by a few px; distances are reference px (see lib/units.ts). */
export type DriftParams = {
  pattern: DriftPattern
  amplitude: number
  /** Wavelength / noise feature size. */
  scale: number
  /** Cycles per second. */
  speed: number
  /** Wave displacement angle in degrees: 0 = horizontal, 90 = vertical. */
  direction: number
  /** Pulse origin as a fraction of image width / height. */
  centerX: number
  centerY: number
  /** Degrees; offsets stacked layers so they don't move in lockstep. */
  phase: number
  /** Glitch and jitter: jumps per second (they step, so a cycles-per-second speed doesn't apply). */
  rate: number
}

const PATTERN_LABELS: Record<DriftPattern, string> = {
  wave: 'Wave',
  orbit: 'Orbit',
  pulse: 'Pulse',
  turbulence: 'Turbulence',
  glitch: 'Glitch',
  jitter: 'Jitter',
}

const isPulse = (params: DriftParams) => params.pattern === 'pulse'
const isStepped = (params: DriftParams) => params.pattern === 'glitch' || params.pattern === 'jitter'
const movesAlongAxis = (params: DriftParams) => params.pattern === 'wave' || isStepped(params)

const DRIFT_PARAM_SPECS: readonly ParamSpec<DriftParams>[] = [
  {
    kind: 'select',
    key: 'pattern',
    label: 'Pattern',
    options: DRIFT_PATTERNS.map((value) => ({ value, label: PATTERN_LABELS[value] })),
  },
  { kind: 'range', key: 'amplitude', label: 'Amplitude', min: 0, max: 20, step: 0.1, unit: 'px' },
  {
    kind: 'range',
    key: 'scale',
    label: 'Scale',
    min: 4,
    max: 800,
    step: 1,
    unit: 'px',
    visibleWhen: (params) => params.pattern !== 'jitter',
  },
  {
    kind: 'range',
    key: 'speed',
    label: 'Speed',
    min: 0,
    max: 3,
    step: 0.01,
    unit: 'Hz',
    visibleWhen: (params) => !isStepped(params),
  },
  { kind: 'range', key: 'rate', label: 'Rate', min: 0, max: 30, step: 0.5, unit: '/s', visibleWhen: isStepped },
  {
    kind: 'range',
    key: 'direction',
    label: 'Direction',
    min: 0,
    max: 360,
    step: 1,
    unit: '°',
    visibleWhen: movesAlongAxis,
  },
  { kind: 'range', key: 'centerX', label: 'Center X', min: 0, max: 1, step: 0.01, visibleWhen: isPulse },
  { kind: 'range', key: 'centerY', label: 'Center Y', min: 0, max: 1, step: 0.01, visibleWhen: isPulse },
  { kind: 'range', key: 'phase', label: 'Phase', min: 0, max: 360, step: 1, unit: '°' },
]

export const driftEffect: EffectDefinition<DriftParams> = {
  type: 'drift',
  label: 'Drift',
  params: DRIFT_PARAM_SPECS,
  defaults: DRIFT_PRESETS[0].params,
  presets: DRIFT_PRESETS,
}

/** The preset whose params equal `params` exactly, so the UI can show "Custom" once anything is edited. */
export function findMatchingPreset(params: DriftParams): EffectPreset<DriftParams> | undefined {
  const keys = Object.keys(params) as (keyof DriftParams)[]
  return DRIFT_PRESETS.find((preset) => keys.every((key) => preset.params[key] === params[key]))
}
