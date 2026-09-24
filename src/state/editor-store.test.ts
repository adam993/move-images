import { beforeEach, describe, expect, it } from 'vitest'
import { rgbToOklab } from '@/lib/color/oklab'
import type { LoadedImage } from '@/lib/image/loaded-image'
import { MAX_LAYERS } from '@/render/limits'
import { BLUE, GREEN, RED, labImageFromPixels, run } from '@/test/synthetic-image'
import { selectActiveLayer, useEditorStore } from './editor-store'

const store = useEditorStore
const lab = labImageFromPixels([...run(RED, 50), ...run(GREEN, 30), ...run(BLUE, 20)], 10, 10)
const image: LoadedImage = { id: 'img-1', name: 'test.jpg', bitmap: {} as ImageBitmap, width: 10, height: 10 }
const red = { lab: rgbToOklab(...RED), hex: '#ff0000' }

const state = () => store.getState()
const activeLayer = () => {
  const layer = selectActiveLayer(state())
  if (!layer) throw new Error('no active layer')
  return layer
}

beforeEach(() => {
  store.setState(store.getInitialState(), true)
  state().setImage(image, { sampleLab: lab, maskLab: lab })
})

describe('setImage', () => {
  it('resets to one active empty layer and computes the palette', () => {
    state().addLayer()
    state().setImage({ ...image, id: 'img-2' }, { sampleLab: lab, maskLab: lab })

    expect(state().layers).toHaveLength(1)
    expect(state().layers[0].name).toBe('Layer 1')
    expect(state().layers[0].selection.targets).toEqual([])
    expect(state().activeLayerId).toBe(state().layers[0].id)
    expect(state().palette.map((entry) => entry.hex)).toEqual(['#ff0000', '#00ff00', '#0000ff'])
  })

  it('clears a previous load error and loading flag', () => {
    state().setLoading(true)
    state().setLoadError('boom')
    state().setLoading(true)
    state().setImage(image, { sampleLab: lab, maskLab: lab })
    expect(state().loadError).toBeNull()
    expect(state().loading).toBe(false)
  })
})

describe('setPaletteSize', () => {
  it('recomputes the palette with the new k', () => {
    state().setPaletteSize(2)
    expect(state().paletteSize).toBe(2)
    expect(state().palette).toHaveLength(2)
  })
})

describe('layers', () => {
  it('adds a numbered layer and makes it active', () => {
    state().addLayer()
    expect(state().layers.map((layer) => layer.name)).toEqual(['Layer 1', 'Layer 2'])
    expect(activeLayer().name).toBe('Layer 2')
  })

  it(`refuses to add more than ${MAX_LAYERS} layers`, () => {
    for (let i = 1; i < MAX_LAYERS; i++) state().addLayer()
    expect(state().layers).toHaveLength(MAX_LAYERS)
    expect(() => state().addLayer()).toThrow(/at most 8/)
  })

  it('duplicates a layer right after the source and activates the copy', () => {
    const source = activeLayer()
    state().toggleTarget(source.id, red)
    state().addLayer()
    state().duplicateLayer(source.id)

    const layers = state().layers
    expect(layers.map((layer) => layer.name)).toEqual(['Layer 1', 'Layer 1 copy', 'Layer 2'])
    expect(layers[1].id).not.toBe(source.id)
    expect(layers[1].selection.targets).toEqual([red])
    expect(activeLayer().id).toBe(layers[1].id)
  })

  it('selects a neighbour when the active layer is removed, and null when none remain', () => {
    state().addLayer()
    state().addLayer()
    const [first, second, third] = state().layers
    state().setActiveLayer(second.id)
    state().removeLayer(second.id)
    expect(state().activeLayerId).toBe(third.id)

    state().removeLayer(third.id)
    expect(state().activeLayerId).toBe(first.id)

    state().removeLayer(first.id)
    expect(state().layers).toEqual([])
    expect(state().activeLayerId).toBeNull()
  })

  it('keeps the active layer when a different layer is removed', () => {
    const first = activeLayer()
    state().addLayer()
    state().setActiveLayer(first.id)
    state().removeLayer(state().layers[1].id)
    expect(state().activeLayerId).toBe(first.id)
  })

  it('toggles a layer on and off', () => {
    const layer = activeLayer()
    state().toggleLayerEnabled(layer.id)
    expect(activeLayer().enabled).toBe(false)
    state().toggleLayerEnabled(layer.id)
    expect(activeLayer().enabled).toBe(true)
  })

  it('throws for an unknown layer id', () => {
    expect(() => state().toggleLayerEnabled('nope')).toThrow(/Unknown layer/)
    expect(() => state().setActiveLayer('nope')).toThrow(/Unknown layer/)
  })
})

describe('selection', () => {
  it('toggles a target color on, then off again', () => {
    const id = activeLayer().id
    state().toggleTarget(id, red)
    expect(activeLayer().selection.targets).toEqual([red])
    state().toggleTarget(id, { ...red })
    expect(activeLayer().selection.targets).toEqual([])
  })

  it('removes a target by hex', () => {
    const id = activeLayer().id
    state().toggleTarget(id, red)
    state().removeTarget(id, '#ff0000')
    expect(activeLayer().selection.targets).toEqual([])
  })

  it('replaces the selection object on selection edits so masks rebuild', () => {
    const before = activeLayer().selection
    state().updateSelection(activeLayer().id, { tolerance: 0.2, invert: true })
    expect(activeLayer().selection).not.toBe(before)
    expect(activeLayer().selection.tolerance).toBe(0.2)
    expect(activeLayer().selection.invert).toBe(true)
  })
})

describe('motion params', () => {
  it('keeps the selection object when only motion changes, so masks are not rebuilt', () => {
    const before = activeLayer().selection
    state().updateParams(activeLayer().id, { amplitude: 7 })
    expect(activeLayer().effect.params.amplitude).toBe(7)
    expect(activeLayer().selection).toBe(before)
  })

  it('applies a preset to params only', () => {
    const id = activeLayer().id
    state().toggleTarget(id, red)
    const selection = activeLayer().selection
    state().applyPreset(id, 'heat-shimmer')
    expect(activeLayer().effect.params.pattern).toBe('turbulence')
    expect(activeLayer().effect.params.scale).toBe(18)
    expect(activeLayer().selection).toBe(selection)
  })

  it('rejects an unknown preset', () => {
    expect(() => state().applyPreset(activeLayer().id, 'nope')).toThrow(/Unknown preset/)
  })
})
