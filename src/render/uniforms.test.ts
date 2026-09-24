import { describe, expect, it } from 'vitest'
import type { DriftParams } from '@/effects/drift/definition'
import { createLayer, type Layer } from '@/state/layer'
import { MAX_LAYERS } from './limits'
import { buildLayerUniforms } from './uniforms'

function layerWith(params: Partial<DriftParams>, enabled = true): Layer {
  const layer = createLayer(1)
  return { ...layer, enabled, effect: { type: 'drift', params: { ...layer.effect.params, ...params } } }
}

describe('buildLayerUniforms', () => {
  it('packs each layer into its own slot of fixed-size arrays', () => {
    const uniforms = buildLayerUniforms(
      [
        layerWith({ pattern: 'wave', amplitude: 3, scale: 50, speed: 0.5, direction: 90, phase: 180 }),
        layerWith({ pattern: 'pulse', amplitude: 1, scale: 200, speed: 0.2, centerX: 0.25, centerY: 0.75 }),
      ],
      1,
    )

    expect(uniforms.count).toBe(2)
    expect(uniforms.modes).toHaveLength(MAX_LAYERS)
    expect(uniforms.paramsA).toHaveLength(MAX_LAYERS * 4)
    expect(Array.from(uniforms.modes.slice(0, 2))).toEqual([0, 2])

    const [amplitude, scale, speed, phase] = uniforms.paramsA.slice(0, 4)
    expect([amplitude, scale, speed]).toEqual([3, 50, 0.5])
    expect(phase).toBeCloseTo(Math.PI, 6)

    const [dirX, dirY] = uniforms.paramsB.slice(0, 2)
    expect(dirX).toBeCloseTo(0, 6)
    expect(dirY).toBeCloseTo(1, 6)
    expect(Array.from(uniforms.paramsB.slice(6, 8))).toEqual([0.25, 0.75])
  })

  it('converts amplitude and scale from reference px to source px, leaving speed alone', () => {
    const uniforms = buildLayerUniforms([layerWith({ amplitude: 3, scale: 50, speed: 0.5 })], 2)
    expect(Array.from(uniforms.paramsA.slice(0, 3))).toEqual([6, 100, 0.5])
  })

  it('maps every pattern to its shader code', () => {
    const patterns = ['wave', 'orbit', 'pulse', 'turbulence', 'glitch', 'jitter'] as const
    const uniforms = buildLayerUniforms(
      patterns.map((pattern) => layerWith({ pattern })),
      1,
    )
    expect(Array.from(uniforms.modes.slice(0, 6))).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('packs rate into the third parameter block', () => {
    const uniforms = buildLayerUniforms([layerWith({ rate: 12 })], 1)
    expect(uniforms.paramsC).toHaveLength(MAX_LAYERS * 4)
    expect(uniforms.paramsC[0]).toBe(12)
  })

  it('zeroes the amplitude of a disabled layer so it keeps its slot but does not move', () => {
    const uniforms = buildLayerUniforms([layerWith({ amplitude: 5, scale: 40 }, false)], 1)
    expect(uniforms.count).toBe(1)
    expect(uniforms.paramsA[0]).toBe(0)
    expect(uniforms.paramsA[1]).toBe(40)
  })

  it('handles an empty stack', () => {
    expect(buildLayerUniforms([], 1).count).toBe(0)
  })

  it(`throws for more than ${MAX_LAYERS} layers`, () => {
    const layers = Array.from({ length: MAX_LAYERS + 1 }, () => layerWith({}))
    expect(() => buildLayerUniforms(layers, 1)).toThrow(/at most 8/)
  })
})
