import { useEffect, useState, type RefObject } from 'react'
import { errorMessage } from '@/lib/error-message'
import type { LoadedImage } from '@/lib/image/loaded-image'
import { DriftRenderer } from '@/render/drift-renderer'
import { MaskSync } from '@/render/mask-sync'
import { useEditorStore } from '@/state/editor-store'

const MAX_DEVICE_PIXEL_RATIO = 2
// A backgrounded tab resumes with a huge frame delta; clamp it so the animation doesn't jump.
const MAX_FRAME_SECONDS = 0.1

/**
 * Runs the render loop for `canvasRef`. Each frame reads the store directly (no React re-render),
 * uploads a newly loaded image, rebuilds changed masks and draws. Returns a message if rendering fails.
 */
export function useDriftRenderer(canvasRef: RefObject<HTMLCanvasElement | null>): string | null {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: DriftRenderer
    try {
      renderer = new DriftRenderer(canvas)
    } catch (cause) {
      setError(errorMessage(cause))
      return
    }
    const maskSync = new MaskSync(renderer, (layerId, coverage) =>
      useEditorStore.getState().setCoverage(layerId, coverage),
    )

    let frame = 0
    let time = 0
    let lastNow = performance.now()
    let uploadedImage: LoadedImage | null = null

    const tick = (now: number) => {
      const state = useEditorStore.getState()
      const elapsed = Math.min(MAX_FRAME_SECONDS, (now - lastNow) / 1000)
      lastNow = now
      if (state.playing) time += elapsed

      try {
        if (state.image && state.image !== uploadedImage) {
          renderer.setImage(state.image.bitmap)
          uploadedImage = state.image
        }
        if (state.analysis) maskSync.sync(state.analysis, state.layers)
        renderer.render({
          time,
          layers: state.layers,
          view: state.view,
          activeLayerIndex: state.layers.findIndex((layer) => layer.id === state.activeLayerId),
        })
      } catch (cause) {
        setError(errorMessage(cause))
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const resizeObserver = new ResizeObserver(([entry]) => {
      const dpr = Math.min(MAX_DEVICE_PIXEL_RATIO, window.devicePixelRatio || 1)
      renderer.resize(entry.contentRect.width, entry.contentRect.height, dpr)
    })
    resizeObserver.observe(canvas)

    const onContextLost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      setError('The GPU context was lost. Reload the page to continue.')
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      renderer.dispose()
    }
  }, [canvasRef])

  return error
}
