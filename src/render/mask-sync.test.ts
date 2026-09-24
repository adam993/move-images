import { beforeEach, describe, expect, it } from 'vitest'
import { rgbToOklab } from '@/lib/color/oklab'
import type { ImageAnalysis } from '@/lib/image/analyze-image'
import type { Mask } from '@/lib/mask/build-mask'
import { createLayer, type Layer } from '@/state/layer'
import { BLUE, GREEN, RED, labImageFromPixels, run } from '@/test/synthetic-image'
import { MaskSync, type MaskTarget } from './mask-sync'

class FakeMaskTarget implements MaskTarget {
  allocations: [number, number][] = []
  uploads: { index: number; mask: Mask }[] = []
  allocateMasks(width: number, height: number) {
    this.allocations.push([width, height])
  }
  setMask(index: number, mask: Mask) {
    this.uploads.push({ index, mask })
  }
}

const lab = labImageFromPixels([...run(RED, 50), ...run(GREEN, 30), ...run(BLUE, 20)], 10, 10)
const analysis: ImageAnalysis = { sampleLab: lab, maskLab: lab }

function layerTargeting(color: typeof RED, id: string): Layer {
  const layer = createLayer(1)
  const hex = `#${color.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  return {
    ...layer,
    id,
    selection: { ...layer.selection, feather: 0, targets: [{ lab: rgbToOklab(...color), hex }] },
  }
}

let target: FakeMaskTarget
let coverage: Map<string, number>
let sync: MaskSync

beforeEach(() => {
  target = new FakeMaskTarget()
  coverage = new Map()
  sync = new MaskSync(target, (layerId, value) => coverage.set(layerId, value))
})

describe('MaskSync', () => {
  it('allocates once per image and uploads each layer mask with its coverage', () => {
    const red = layerTargeting(RED, 'red')
    const green = layerTargeting(GREEN, 'green')
    sync.sync(analysis, 10, [red, green])

    expect(target.allocations).toEqual([[10, 10]])
    expect(target.uploads.map((upload) => upload.index)).toEqual([0, 1])
    expect(coverage.get('red')).toBeCloseTo(0.5, 6)
    expect(coverage.get('green')).toBeCloseTo(0.3, 6)
  })

  it('does nothing for a motion-only edit (same selection object)', () => {
    const red = layerTargeting(RED, 'red')
    sync.sync(analysis, 10, [red])
    sync.sync(analysis, 10, [{ ...red, effect: { ...red.effect, params: { ...red.effect.params, amplitude: 9 } } }])
    expect(target.uploads).toHaveLength(1)
  })

  it('gives a duplicate its coverage and reuses the source mask instead of rebuilding', () => {
    const red = layerTargeting(RED, 'red')
    sync.sync(analysis, 10, [red])
    sync.sync(analysis, 10, [red, { ...red, id: 'copy' }])

    expect(target.uploads[1].index).toBe(1)
    expect(target.uploads[1].mask).toBe(target.uploads[0].mask)
    expect(coverage.get('copy')).toBeCloseTo(0.5, 6)
  })

  it('reports coverage for a copy made after deleting an earlier copy of the same layer', () => {
    const red = layerTargeting(RED, 'red')
    sync.sync(analysis, 10, [red])
    sync.sync(analysis, 10, [red, { ...red, id: 'copy-1' }])
    sync.sync(analysis, 10, [red])
    sync.sync(analysis, 10, [red, { ...red, id: 'copy-2' }])

    expect(coverage.get('copy-2')).toBeCloseTo(0.5, 6)
  })

  it('moves later masks down a slot after a delete without rebuilding them', () => {
    const red = layerTargeting(RED, 'red')
    const blue = layerTargeting(BLUE, 'blue')
    sync.sync(analysis, 10, [red, blue])
    const blueMask = target.uploads[1].mask

    sync.sync(analysis, 10, [blue])
    expect(target.uploads[2]).toEqual({ index: 0, mask: blueMask })
    expect(target.uploads[2].mask).toBe(blueMask)
  })

  it('reallocates and rebuilds every mask for a new image', () => {
    const red = layerTargeting(RED, 'red')
    sync.sync(analysis, 10, [red])
    const nextAnalysis: ImageAnalysis = { sampleLab: lab, maskLab: lab }
    sync.sync(nextAnalysis, 10, [red])

    expect(target.allocations).toHaveLength(2)
    expect(target.uploads).toHaveLength(2)
    expect(target.uploads[1].mask).not.toBe(target.uploads[0].mask)
  })
})
