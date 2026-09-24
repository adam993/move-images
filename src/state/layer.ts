import { driftEffect, type DriftParams } from '@/effects/drift/definition'
import type { Selection, TargetColor } from '@/lib/mask/selection'

export type Layer = {
  id: string
  name: string
  enabled: boolean
  selection: Selection
  effect: { type: 'drift'; params: DriftParams }
}

export const DEFAULT_SELECTION: Selection = {
  targets: [],
  tolerance: 0.1,
  softness: 0.05,
  feather: 6,
  invert: false,
}

const windPreset = driftEffect.presets.find((preset) => preset.id === 'wind-foliage')
if (!windPreset) throw new Error('The "wind-foliage" preset that new layers start from is missing')

/** Motion every new layer starts with: Wind in foliage, stronger than the preset so it reads at a glance. */
export const STARTING_MOTION: DriftParams = { ...windPreset.params, amplitude: 9 }

export function createLayer(number: number, targets: readonly TargetColor[] = []): Layer {
  return {
    id: crypto.randomUUID(),
    name: `Layer ${number}`,
    enabled: true,
    selection: { ...DEFAULT_SELECTION, targets },
    effect: { type: 'drift', params: { ...STARTING_MOTION } },
  }
}
