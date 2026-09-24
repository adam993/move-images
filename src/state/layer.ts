import { driftEffect, type DriftParams } from '@/effects/drift/definition'
import type { Selection } from '@/lib/mask/selection'

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

export function createLayer(number: number): Layer {
  return {
    id: crypto.randomUUID(),
    name: `Layer ${number}`,
    enabled: true,
    selection: { ...DEFAULT_SELECTION },
    effect: { type: 'drift', params: { ...driftEffect.defaults } },
  }
}
