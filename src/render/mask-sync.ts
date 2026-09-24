import type { ImageAnalysis } from '@/lib/image/analyze-image'
import { buildMask, type Mask } from '@/lib/mask/build-mask'
import type { Selection } from '@/lib/mask/selection'
import type { Layer } from '@/state/layer'
import type { DriftRenderer } from './drift-renderer'

export type MaskTarget = Pick<DriftRenderer, 'allocateMasks' | 'setMask'>

type Slot = { selection: Selection; layerId: string }

/**
 * Keeps the renderer's mask slices in step with the layer stack. Masks are cached per selection object
 * (the store replaces it on every selection edit), so a mask is built once and then only re-uploaded
 * when layers shift slots or get duplicated; motion edits cost nothing.
 */
export class MaskSync {
  private readonly target: MaskTarget
  private readonly onCoverage: (layerId: string, coverage: number) => void
  private analysis: ImageAnalysis | null = null
  private masks = new WeakMap<Selection, Mask>()
  private slots: (Slot | undefined)[] = []

  constructor(target: MaskTarget, onCoverage: (layerId: string, coverage: number) => void) {
    this.target = target
    this.onCoverage = onCoverage
  }

  sync(analysis: ImageAnalysis, sourceWidth: number, layers: readonly Layer[]): void {
    const { maskLab } = analysis
    if (analysis !== this.analysis) {
      this.target.allocateMasks(maskLab.width, maskLab.height)
      this.analysis = analysis
      this.masks = new WeakMap()
      this.slots = []
    }

    layers.forEach((layer, index) => {
      const slot = this.slots[index]
      if (slot?.selection === layer.selection && slot.layerId === layer.id) return

      let mask = this.masks.get(layer.selection)
      if (!mask) {
        const featherPx = (layer.selection.feather * maskLab.width) / sourceWidth
        mask = buildMask(maskLab, layer.selection, featherPx)
        this.masks.set(layer.selection, mask)
      }
      if (slot?.selection !== layer.selection) this.target.setMask(index, mask)
      this.slots[index] = { selection: layer.selection, layerId: layer.id }
      this.onCoverage(layer.id, mask.coverage)
    })
  }
}
