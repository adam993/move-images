import { labImageFromRgba, type LabImage } from '@/lib/color/lab-image'
import { fitWithin } from './fit-within'

/** Palette and share statistics run on this grid; a uniform downsample keeps the proportions. */
export const SAMPLE_MAX_SIDE = 256
/** Masks are built on this grid: fine enough for thin strokes, cheap enough to rebuild while dragging a slider. */
export const MASK_MAX_SIDE = 1024

/** OKLab grids of an image: a small one for palette/share statistics, a larger one for masks. */
export type ImageAnalysis = { sampleLab: LabImage; maskLab: LabImage }

export function analyzeImage(bitmap: ImageBitmap): ImageAnalysis {
  return {
    sampleLab: rasterizeToLab(bitmap, SAMPLE_MAX_SIDE),
    maskLab: rasterizeToLab(bitmap, MASK_MAX_SIDE),
  }
}

function rasterizeToLab(bitmap: ImageBitmap, maxSide: number): LabImage {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide)
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('This browser has no 2D canvas context, so image colors cannot be analysed')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  return labImageFromRgba(context.getImageData(0, 0, width, height).data, width, height)
}
