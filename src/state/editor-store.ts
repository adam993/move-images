import { create } from 'zustand'
import { driftEffect, type DriftParams } from '@/effects/drift/definition'
import type { Lab, Rgb } from '@/lib/color/oklab'
import { extractPalette, type PaletteEntry } from '@/lib/color/palette'
import type { ImageAnalysis } from '@/lib/image/analyze-image'
import type { LoadedImage } from '@/lib/image/loaded-image'
import type { Selection, TargetColor } from '@/lib/mask/selection'
import { MAX_LAYERS } from '@/render/limits'
import { createLayer, type Layer } from './layer'

export type ViewMode = 'animated' | 'mask' | 'original'

export type HoverInfo = {
  lab: Lab
  rgb: Rgb
  hex: string
  nearestIndex: number
  /** Fraction of the image within the active layer's tolerance of this color. */
  similarShare: number
}

export type EditorState = {
  image: LoadedImage | null
  analysis: ImageAnalysis | null
  loadError: string | null
  loading: boolean
  paletteSize: number
  palette: PaletteEntry[]
  layers: Layer[]
  activeLayerId: string | null
  /** Numbers new layers; never reused after a delete. */
  layerCounter: number
  /** Selected fraction per layer id, reported by the mask builder. */
  coverage: Record<string, number>
  playing: boolean
  view: ViewMode
  eyedropper: boolean
  hover: HoverInfo | null
}

export type EditorActions = {
  setImage(image: LoadedImage, analysis: ImageAnalysis): void
  setLoading(loading: boolean): void
  setLoadError(message: string | null): void
  setPaletteSize(k: number): void
  addLayer(): void
  duplicateLayer(id: string): void
  removeLayer(id: string): void
  setActiveLayer(id: string): void
  toggleLayerEnabled(id: string): void
  toggleTarget(id: string, target: TargetColor): void
  removeTarget(id: string, hex: string): void
  updateSelection(id: string, patch: Partial<Omit<Selection, 'targets'>>): void
  updateParams(id: string, patch: Partial<DriftParams>): void
  applyPreset(id: string, presetId: string): void
  setCoverage(id: string, value: number): void
  togglePlaying(): void
  setView(view: ViewMode): void
  setEyedropper(on: boolean): void
  setHover(hover: HoverInfo | null): void
}

export type EditorStore = EditorState & EditorActions

const INITIAL_STATE: EditorState = {
  image: null,
  analysis: null,
  loadError: null,
  loading: false,
  paletteSize: 12,
  palette: [],
  layers: [],
  activeLayerId: null,
  layerCounter: 0,
  coverage: {},
  playing: true,
  view: 'animated',
  eyedropper: false,
  hover: null,
}

function indexOfLayer(layers: readonly Layer[], id: string): number {
  const index = layers.findIndex((layer) => layer.id === id)
  if (index === -1) throw new Error(`Unknown layer "${id}"`)
  return index
}

export const useEditorStore = create<EditorStore>()((set, get) => {
  const updateLayer = (id: string, update: (layer: Layer) => Layer) => {
    const { layers } = get()
    const index = indexOfLayer(layers, id)
    set({ layers: layers.with(index, update(layers[index])) })
  }

  const updateTargets = (id: string, update: (targets: readonly TargetColor[]) => TargetColor[]) =>
    updateLayer(id, (layer) => ({
      ...layer,
      selection: { ...layer.selection, targets: update(layer.selection.targets) },
    }))

  const assertRoomForLayer = () => {
    if (get().layers.length >= MAX_LAYERS) {
      throw new Error(`A stack holds at most ${MAX_LAYERS} layers`)
    }
  }

  return {
    ...INITIAL_STATE,

    setImage: (image, analysis) => {
      const first = createLayer(1)
      set({
        image,
        analysis,
        loadError: null,
        loading: false,
        palette: extractPalette(analysis.sampleLab, get().paletteSize),
        layers: [first],
        activeLayerId: first.id,
        layerCounter: 1,
        coverage: {},
        hover: null,
      })
    },

    setLoading: (loading) => set({ loading }),

    setLoadError: (message) => set({ loadError: message, loading: false }),

    setPaletteSize: (k) => {
      const { analysis } = get()
      set({ paletteSize: k, palette: analysis ? extractPalette(analysis.sampleLab, k) : [] })
    },

    addLayer: () => {
      assertRoomForLayer()
      const number = get().layerCounter + 1
      const layer = createLayer(number)
      set({ layers: [...get().layers, layer], activeLayerId: layer.id, layerCounter: number })
    },

    duplicateLayer: (id) => {
      assertRoomForLayer()
      const { layers } = get()
      const index = indexOfLayer(layers, id)
      const source = layers[index]
      const copy: Layer = { ...source, id: crypto.randomUUID(), name: `${source.name} copy` }
      set({ layers: layers.toSpliced(index + 1, 0, copy), activeLayerId: copy.id })
    },

    removeLayer: (id) => {
      const { layers, activeLayerId, coverage } = get()
      const index = indexOfLayer(layers, id)
      const remaining = layers.toSpliced(index, 1)
      const nextActive =
        activeLayerId === id ? (remaining[Math.min(index, remaining.length - 1)]?.id ?? null) : activeLayerId
      const { [id]: _removed, ...restCoverage } = coverage
      set({ layers: remaining, activeLayerId: nextActive, coverage: restCoverage })
    },

    setActiveLayer: (id) => {
      indexOfLayer(get().layers, id)
      set({ activeLayerId: id })
    },

    toggleLayerEnabled: (id) => updateLayer(id, (layer) => ({ ...layer, enabled: !layer.enabled })),

    toggleTarget: (id, target) =>
      updateTargets(id, (targets) =>
        targets.some((existing) => existing.hex === target.hex)
          ? targets.filter((existing) => existing.hex !== target.hex)
          : [...targets, target],
      ),

    removeTarget: (id, hex) => updateTargets(id, (targets) => targets.filter((target) => target.hex !== hex)),

    updateSelection: (id, patch) =>
      updateLayer(id, (layer) => ({ ...layer, selection: { ...layer.selection, ...patch } })),

    updateParams: (id, patch) =>
      updateLayer(id, (layer) => ({
        ...layer,
        effect: { ...layer.effect, params: { ...layer.effect.params, ...patch } },
      })),

    applyPreset: (id, presetId) => {
      const preset = driftEffect.presets.find((candidate) => candidate.id === presetId)
      if (!preset) throw new Error(`Unknown preset "${presetId}"`)
      updateLayer(id, (layer) => ({ ...layer, effect: { ...layer.effect, params: { ...preset.params } } }))
    },

    setCoverage: (id, value) => set({ coverage: { ...get().coverage, [id]: value } }),

    togglePlaying: () => set({ playing: !get().playing }),

    setView: (view) => set({ view }),

    setEyedropper: (on) => set({ eyedropper: on }),

    setHover: (hover) => set({ hover }),
  }
})

export function selectActiveLayer(state: EditorState): Layer | undefined {
  return state.layers.find((layer) => layer.id === state.activeLayerId)
}
