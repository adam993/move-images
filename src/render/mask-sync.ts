import type { ImageAnalysis } from '@/lib/image/analyze-image'
import { buildMask } from '@/lib/mask/build-mask'
import type { Selection } from '@/lib/mask/selection'
import type { Layer } from '@/state/layer'
import type { DriftRenderer } from './drift-renderer'

/**
 * Keeps the renderer's mask slices in step with the layer stack. Slice i is rebuilt only when the
 * selection object at index i changes — the store replaces it on every selection edit — so motion
 * edits and unchanged layers cost nothing.
 */
export class MaskSync {
  private readonly renderer: DriftRenderer
  private readonly onCoverage: (layerId: string, coverage: number) => void
  private analysis: ImageAnalysis | null = null
  private uploaded: (Selection | undefined)[] = []

  constructor(renderer: DriftRenderer, onCoverage: (layerId: string, coverage: number) => void) {
    this.renderer = renderer
    this.onCoverage = onCoverage
  }

  sync(analysis: ImageAnalysis, sourceWidth: number, layers: readonly Layer[]): void {
    const { maskLab } = analysis
    if (analysis !== this.analysis) {
      this.renderer.allocateMasks(maskLab.width, maskLab.height)
      this.analysis = analysis
      this.uploaded = []
    }

    layers.forEach((layer, index) => {
      if (this.uploaded[index] === layer.selection) return
      const featherPx = (layer.selection.feather * maskLab.width) / sourceWidth
      const mask = buildMask(maskLab, layer.selection, featherPx)
      this.renderer.setMask(index, mask)
      this.uploaded[index] = layer.selection
      this.onCoverage(layer.id, mask.coverage)
    })
  }
}
