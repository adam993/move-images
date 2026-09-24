import type { DriftPattern } from '@/effects/drift/definition'
import type { Layer } from '@/state/layer'
import { MAX_LAYERS } from './limits'

/** Must match the `mode` branches in drift.frag.glsl. */
export const PATTERN_CODES: Record<DriftPattern, number> = {
  wave: 0,
  orbit: 1,
  pulse: 2,
  turbulence: 3,
  glitch: 4,
  jitter: 5,
}

/**
 * Fixed-size arrays for the shader's uniform arrays. Slot i belongs to layers[i] and to slice i of the
 * mask texture array, so disabled layers keep their slot (with zero amplitude) instead of being skipped.
 */
export type LayerUniforms = {
  count: number
  modes: Int32Array
  /** Per layer: amplitude (source px), scale (source px), speed Hz, phase rad. */
  paramsA: Float32Array
  /** Per layer: direction x, direction y, center x (0–1), center y (0–1). */
  paramsB: Float32Array
  /** Per layer: rate (jumps/s), unused, unused, unused. */
  paramsC: Float32Array
}

const DEG_TO_RAD = Math.PI / 180

/** `pixelScale` converts reference px to source px (see lib/units.ts). */
export function buildLayerUniforms(layers: readonly Layer[], pixelScale: number): LayerUniforms {
  if (layers.length > MAX_LAYERS) {
    throw new Error(`The renderer supports at most ${MAX_LAYERS} layers, got ${layers.length}`)
  }

  const modes = new Int32Array(MAX_LAYERS)
  const paramsA = new Float32Array(MAX_LAYERS * 4)
  const paramsB = new Float32Array(MAX_LAYERS * 4)
  const paramsC = new Float32Array(MAX_LAYERS * 4)

  layers.forEach((layer, i) => {
    const p = layer.effect.params
    const direction = p.direction * DEG_TO_RAD
    modes[i] = PATTERN_CODES[p.pattern]
    const amplitude = layer.enabled ? p.amplitude * pixelScale : 0
    paramsA.set([amplitude, p.scale * pixelScale, p.speed, p.phase * DEG_TO_RAD], i * 4)
    paramsB.set([Math.cos(direction), Math.sin(direction), p.centerX, p.centerY], i * 4)
    paramsC[i * 4] = p.rate
  })

  return { count: layers.length, modes, paramsA, paramsB, paramsC }
}
