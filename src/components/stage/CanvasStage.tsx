import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { useCanvasPointer } from '@/hooks/use-canvas-pointer'
import { useDriftRenderer } from '@/hooks/use-drift-renderer'
import { useFittedSize } from '@/hooks/use-fitted-size'
import { useEditorStore } from '@/state/editor-store'
import { loadFile } from '@/state/image-actions'
import { StageMessage } from './StageMessage'

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const image = useEditorStore((state) => state.image)
  const loading = useEditorStore((state) => state.loading)
  const loadError = useEditorStore((state) => state.loadError)
  const eyedropper = useEditorStore((state) => state.eyedropper)
  const rendererError = useDriftRenderer(canvasRef)
  const size = useFittedSize(containerRef, image ? image.width / image.height : null)
  const pointer = useCanvasPointer()
  const [dragging, setDragging] = useState(false)

  const onDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setDragging(true)
  }
  const onDragLeave = (event: DragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Always mounted: the render loop binds to this element once. */}
      <canvas
        ref={canvasRef}
        data-testid="stage-canvas"
        className={cn('shadow-2xl shadow-black/50', eyedropper && 'cursor-crosshair', !image && 'invisible')}
        style={{ width: size?.width ?? 0, height: size?.height ?? 0 }}
        onPointerMove={pointer.onPointerMove}
        onPointerLeave={pointer.onPointerLeave}
        onClick={pointer.onClick}
      />

      {rendererError && (
        <StageMessage tone="error" title="Can't render effects">
          {rendererError}
        </StageMessage>
      )}
      {!rendererError && !image && !loading && !loadError && (
        <StageMessage title="No image">Choose a sample or drop an image here.</StageMessage>
      )}
      {loading && (
        <p className="absolute top-3 right-4 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">Loading…</p>
      )}
      {loadError && (
        <div
          role="alert"
          className="absolute inset-x-6 top-3 flex items-start justify-between gap-4 rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm"
        >
          <span>{loadError}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => useEditorStore.getState().setLoadError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {dragging && (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-lg border-2 border-dashed border-ring bg-background/70 text-sm">
          Drop an image to load it
        </div>
      )}
    </div>
  )
}
