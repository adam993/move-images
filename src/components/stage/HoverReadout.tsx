import { formatPercent } from '@/lib/format'
import { selectActiveLayer, useEditorStore } from '@/state/editor-store'
import { DEFAULT_SELECTION } from '@/state/layer'
import { ColorSwatch } from '@/components/color-swatch'

export function HoverReadout() {
  const hover = useEditorStore((state) => state.hover)
  const palette = useEditorStore((state) => state.palette)
  const tolerance = useEditorStore(
    (state) => selectActiveLayer(state)?.selection.tolerance ?? DEFAULT_SELECTION.tolerance,
  )

  if (!hover) {
    return (
      <div className="flex h-10 shrink-0 items-center border-t border-border px-4 text-xs text-muted-foreground">
        Hover the image to inspect a color · with “Pick color” on, click to select it
      </div>
    )
  }

  const nearest = palette[hover.nearestIndex]
  const [L, a, b] = hover.lab

  return (
    <div className="flex h-10 shrink-0 items-center gap-5 border-t border-border px-4 text-xs tabular-nums">
      <span className="flex items-center gap-2 font-medium">
        <ColorSwatch hex={hover.hex} /> {hover.hex}
      </span>
      <span className="text-muted-foreground">
        OKLab {L.toFixed(2)} {a.toFixed(2)} {b.toFixed(2)}
      </span>
      {nearest && (
        <span className="flex items-center gap-2 text-muted-foreground">
          Palette <ColorSwatch hex={nearest.hex} /> {formatPercent(nearest.share)}
        </span>
      )}
      <span>
        <span className="font-medium">{formatPercent(hover.similarShare)}</span>
        <span className="text-muted-foreground"> of pixels within ±{tolerance.toFixed(2)}</span>
      </span>
    </div>
  )
}
