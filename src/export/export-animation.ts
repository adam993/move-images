import type { ImageAnalysis } from '@/lib/image/analyze-image'
import type { LoadedImage } from '@/lib/image/loaded-image'
import { DriftRenderer } from '@/render/drift-renderer'
import { MaskSync } from '@/render/mask-sync'
import type { Layer } from '@/state/layer'
import { encodeGif } from './encode-gif'
import { encodeVideo } from './encode-video'
import { exportFileName, frameCount, outputSize, type ExportSettings } from './export-settings'
import { loopLayers } from './loop-timing'

/** Everything an export needs, captured when it starts so later edits in the editor don't leak in. */
export type ExportJob = {
  settings: ExportSettings
  image: LoadedImage
  analysis: ImageAnalysis
  layers: readonly Layer[]
}

export type ExportResult = { blob: Blob; fileName: string; width: number; height: number; frameCount: number }

/** Seconds per loop and the layers to render, with speeds snapped when seamless looping is on. */
export function exportTiming(settings: ExportSettings, layers: readonly Layer[]) {
  const frames = frameCount(settings)
  const loopSeconds = frames / settings.fps
  const looped = settings.seamlessLoop ? loopLayers(layers, loopSeconds) : { layers: [...layers], adjustments: [] }
  return { frames, loopSeconds, ...looped }
}

/** Renders frame i at t = i / fps on an export-sized offscreen renderer and encodes the result. */
export async function exportAnimation(
  job: ExportJob,
  signal: AbortSignal,
  onProgress: (fraction: number) => void,
): Promise<ExportResult> {
  const { settings, image, analysis } = job
  const { width, height } = outputSize(image.width, image.height, settings)
  const { frames, loopSeconds, layers } = exportTiming(settings, job.layers)
  if (frames < 1) throw new Error(`An export needs at least one frame, got ${frames}`)

  const canvas = new OffscreenCanvas(width, height)
  const renderer = new DriftRenderer(canvas)
  try {
    renderer.setImage(image.bitmap)
    // Coverage is only shown in the editor; the export has no use for it.
    new MaskSync(renderer, () => {}).sync(analysis, layers)

    const renderFrame = (index: number) =>
      renderer.render({
        time: index / settings.fps,
        layers,
        view: 'animated',
        activeLayerIndex: -1,
        loopDuration: settings.seamlessLoop ? loopSeconds : 0,
      })
    const encodeOptions = { fps: settings.fps, frameCount: frames, signal, onProgress }

    const blob =
      settings.format === 'gif'
        ? await encodeGif(
            (index) => {
              renderFrame(index)
              return renderer.readPixels()
            },
            { ...encodeOptions, width, height },
          )
        : await encodeVideo(canvas, renderFrame, { ...encodeOptions, format: settings.format })

    return { blob, fileName: exportFileName(image.name, settings.format), width, height, frameCount: frames }
  } finally {
    renderer.loseContext()
  }
}
