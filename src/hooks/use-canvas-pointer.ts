import { useCallback, useEffect, useRef, type MouseEvent } from 'react'
import { labAt } from '@/lib/color/lab-image'
import { oklabToRgb, rgbToHex, type Lab } from '@/lib/color/oklab'
import { nearestPaletteIndex, similarShare } from '@/lib/color/similarity'
import { selectActiveLayer, useEditorStore, type HoverInfo } from '@/state/editor-store'
import { DEFAULT_SELECTION } from '@/state/layer'

function colorUnderPointer(event: MouseEvent<HTMLCanvasElement>): Lab | null {
  const { analysis } = useEditorStore.getState()
  if (!analysis) return null
  const rect = event.currentTarget.getBoundingClientRect()
  const u = (event.clientX - rect.left) / rect.width
  const v = (event.clientY - rect.top) / rect.height
  return labAt(analysis.maskLab, u * analysis.maskLab.width, v * analysis.maskLab.height)
}

function describeColor(lab: Lab): HoverInfo | null {
  const state = useEditorStore.getState()
  if (!state.analysis) return null
  const rgb = oklabToRgb(lab)
  const tolerance = selectActiveLayer(state)?.selection.tolerance ?? DEFAULT_SELECTION.tolerance
  return {
    lab,
    rgb,
    hex: rgbToHex(rgb),
    nearestIndex: nearestPaletteIndex(state.palette, lab),
    similarShare: similarShare(state.analysis.sampleLab, lab, tolerance),
  }
}

/** Hover inspection (throttled to one update per frame) and eyedropper picking on the stage canvas. */
export function useCanvasPointer() {
  const pendingLab = useRef<Lab | null>(null)
  const frame = useRef(0)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    pendingLab.current = colorUnderPointer(event)
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const lab = pendingLab.current
      useEditorStore.getState().setHover(lab ? describeColor(lab) : null)
    })
  }, [])

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    useEditorStore.getState().setHover(null)
  }, [])

  const onClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const state = useEditorStore.getState()
    const layer = selectActiveLayer(state)
    if (!state.eyedropper || !layer) return
    const lab = colorUnderPointer(event)
    if (!lab) return
    state.toggleTarget(layer.id, { lab, hex: rgbToHex(oklabToRgb(lab)) })
  }, [])

  return { onPointerMove, onPointerLeave, onClick }
}
