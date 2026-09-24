import type { Layer } from '@/state/layer'

export type LoopAdjustment = { layerId: string; layerName: string; fromHz: number; toHz: number }

const SPEED_EPSILON = 1e-9

/**
 * Makes periodic layers (wave, orbit, pulse) complete a whole number of cycles in `loopSeconds`, so the last
 * frame flows into the first. Turbulence is looped in the shader instead, and speed 0 is already static.
 * Only enabled layers are reported, since a disabled layer's change is invisible.
 */
export function loopLayers(
  layers: readonly Layer[],
  loopSeconds: number,
): { layers: Layer[]; adjustments: LoopAdjustment[] } {
  const adjustments: LoopAdjustment[] = []
  const looped = layers.map((layer) => {
    const { params } = layer.effect
    if (params.pattern === 'turbulence' || params.speed === 0) return layer

    const cycles = Math.max(1, Math.round(params.speed * loopSeconds))
    const speed = cycles / loopSeconds
    if (Math.abs(speed - params.speed) < SPEED_EPSILON) return layer

    if (layer.enabled) {
      adjustments.push({ layerId: layer.id, layerName: layer.name, fromHz: params.speed, toHz: speed })
    }
    return { ...layer, effect: { ...layer.effect, params: { ...params, speed } } }
  })
  return { layers: looped, adjustments }
}
