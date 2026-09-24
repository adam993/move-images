import type { Layer } from '@/state/layer'

export type LoopAdjustment = {
  layerId: string
  layerName: string
  /** `speed` is cycles per second; `rate` is jumps per second (glitch, jitter). */
  param: 'speed' | 'rate'
  from: number
  to: number
}

const SNAP_EPSILON = 1e-9

/**
 * Makes every repeating layer fit a whole number of repeats in `loopSeconds`, so the last frame flows into
 * the first: cycles for wave, orbit and pulse; jumps for glitch and jitter (the shader wraps their
 * random sequence at the loop). Turbulence is looped in the shader instead, and 0 is already static.
 * Only enabled layers are reported, since a disabled layer's change is invisible.
 */
export function loopLayers(
  layers: readonly Layer[],
  loopSeconds: number,
): { layers: Layer[]; adjustments: LoopAdjustment[] } {
  const adjustments: LoopAdjustment[] = []
  const looped = layers.map((layer) => {
    const { params } = layer.effect
    if (params.pattern === 'turbulence') return layer
    const param = params.pattern === 'glitch' || params.pattern === 'jitter' ? 'rate' : 'speed'
    const from = params[param]
    if (from === 0) return layer

    // A stepped pattern with one jump per loop would hold a single offset for the whole file.
    const minRepeats = param === 'rate' ? 2 : 1
    const repeats = Math.max(minRepeats, Math.round(from * loopSeconds))
    const to = repeats / loopSeconds
    if (Math.abs(to - from) < SNAP_EPSILON) return layer

    if (layer.enabled) adjustments.push({ layerId: layer.id, layerName: layer.name, param, from, to })
    return { ...layer, effect: { ...layer.effect, params: { ...params, [param]: to } } }
  })
  return { layers: looped, adjustments }
}
