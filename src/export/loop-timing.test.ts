import { describe, expect, it } from 'vitest'
import type { DriftParams } from '@/effects/drift/definition'
import { createLayer, type Layer } from '@/state/layer'
import { loopLayers } from './loop-timing'

function layer(name: string, params: Partial<DriftParams>, enabled = true): Layer {
  const base = createLayer(1)
  return { ...base, id: name, name, enabled, effect: { type: 'drift', params: { ...base.effect.params, ...params } } }
}

describe('loopLayers', () => {
  it('snaps a periodic layer to a whole number of cycles over the loop and reports the change', () => {
    const { layers, adjustments } = loopLayers([layer('Water', { pattern: 'wave', speed: 0.35 })], 4)
    expect(layers[0].effect.params.speed).toBeCloseTo(0.25, 10)
    expect(adjustments).toEqual([{ layerId: 'Water', layerName: 'Water', param: 'speed', from: 0.35, to: 0.25 }])
  })

  it('leaves a speed that already fits the loop untouched and unreported', () => {
    const source = layer('Swirl', { pattern: 'orbit', speed: 0.5 })
    const { layers, adjustments } = loopLayers([source], 4)
    expect(layers[0]).toBe(source)
    expect(adjustments).toEqual([])
  })

  it('rounds up to at least one full cycle', () => {
    const { layers } = loopLayers([layer('Slow', { pattern: 'pulse', speed: 0.1 })], 4)
    expect(layers[0].effect.params.speed).toBeCloseTo(0.25, 10)
  })

  it('does not touch turbulence (the shader loops it) or a static speed-0 layer', () => {
    const turbulence = layer('Leaves', { pattern: 'turbulence', speed: 0.37 })
    const still = layer('Still', { pattern: 'wave', speed: 0 })
    const { layers, adjustments } = loopLayers([turbulence, still], 4)
    expect(layers).toEqual([turbulence, still])
    expect(adjustments).toEqual([])
  })

  it('snaps a disabled layer too but does not report it, since it does not move', () => {
    const { layers, adjustments } = loopLayers([layer('Off', { pattern: 'wave', speed: 0.35 }, false)], 4)
    expect(layers[0].effect.params.speed).toBeCloseTo(0.25, 10)
    expect(adjustments).toEqual([])
  })

  it('snaps rate instead of speed for glitch and jitter, to whole jumps per loop', () => {
    const glitch = layer('Tear', { pattern: 'glitch', rate: 8.3, speed: 0.35 })
    const { layers, adjustments } = loopLayers([glitch], 4)
    expect(layers[0].effect.params.rate).toBeCloseTo(8.25, 10)
    expect(layers[0].effect.params.speed).toBe(0.35)
    expect(adjustments).toEqual([{ layerId: 'Tear', layerName: 'Tear', param: 'rate', from: 8.3, to: 8.25 }])
  })

  it('gives glitch and jitter at least two jumps per loop, since one jump would freeze them', () => {
    const { layers, adjustments } = loopLayers([layer('Slow', { pattern: 'jitter', rate: 0.5 })], 2)
    expect(layers[0].effect.params.rate).toBe(1)
    expect(adjustments).toEqual([{ layerId: 'Slow', layerName: 'Slow', param: 'rate', from: 0.5, to: 1 }])
  })

  it('uses the real loop length when duration × fps is not a whole number of frames', () => {
    const loopSeconds = 113 / 25 // 4.5 s at 25 fps rounds to 113 frames
    const { layers } = loopLayers([layer('Water', { pattern: 'wave', speed: 0.35 })], loopSeconds)
    expect(layers[0].effect.params.speed).toBeCloseTo(2 / loopSeconds, 10)
  })
})
