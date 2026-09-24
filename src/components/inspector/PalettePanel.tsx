import { Check } from 'lucide-react'
import { useState } from 'react'
import { SectionLabel } from '@/components/section-label'
import { Slider } from '@/components/ui/slider'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { selectActiveLayer, useEditorStore } from '@/state/editor-store'

const MIN_COLORS = 4
const MAX_COLORS = 24

export function PalettePanel() {
  const palette = useEditorStore((state) => state.palette)
  const paletteSize = useEditorStore((state) => state.paletteSize)
  const activeLayer = useEditorStore(selectActiveLayer)
  const hoveredIndex = useEditorStore((state) => state.hover?.nearestIndex ?? -1)
  // k-means reruns only when the slider is released; the label follows the drag.
  const [draftSize, setDraftSize] = useState(paletteSize)
  const targetHexes = new Set(activeLayer?.selection.targets.map((target) => target.hex))

  const toggle = (index: number) => {
    if (!activeLayer) return
    const { lab, hex } = palette[index]
    useEditorStore.getState().toggleTarget(activeLayer.id, { lab, hex })
  }

  return (
    <section>
      <SectionLabel aside={<span className="text-xs text-muted-foreground tabular-nums">{palette.length} colors</span>}>
        Palette
      </SectionLabel>

      <div className="mb-3 flex h-2.5 overflow-hidden rounded-sm" aria-hidden>
        {palette.map((entry) => (
          <span key={entry.hex} style={{ width: `${entry.share * 100}%`, backgroundColor: entry.hex }} />
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1">
        {palette.map((entry, index) => {
          const targeted = targetHexes.has(entry.hex)
          return (
            <button
              key={entry.hex}
              type="button"
              title={`${entry.hex} · ${formatPercent(entry.share)} of pixels`}
              aria-label={`${entry.hex}, ${formatPercent(entry.share)} of pixels`}
              aria-pressed={targeted}
              disabled={!activeLayer}
              onClick={() => toggle(index)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md p-1 transition-colors hover:bg-muted disabled:opacity-50',
                targeted && 'bg-muted ring-2 ring-primary',
                !targeted && index === hoveredIndex && 'ring-1 ring-ring',
              )}
            >
              <span
                className="relative flex h-7 w-full items-center justify-center rounded-sm ring-1 ring-foreground/15"
                style={{ backgroundColor: entry.hex }}
              >
                {targeted && <Check className={cn('size-4', entry.lab[0] > 0.6 ? 'text-black' : 'text-white')} />}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{formatPercent(entry.share)}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between text-xs">
          <span>Palette size</span>
          <span className="text-muted-foreground tabular-nums">{draftSize}</span>
        </div>
        <Slider
          aria-label="Palette size"
          min={MIN_COLORS}
          max={MAX_COLORS}
          step={1}
          value={[draftSize]}
          onValueChange={([next]) => setDraftSize(next)}
          onValueCommit={([next]) => useEditorStore.getState().setPaletteSize(next)}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Click a color to make its pixels (and similar ones) move on the active layer.
      </p>
    </section>
  )
}
