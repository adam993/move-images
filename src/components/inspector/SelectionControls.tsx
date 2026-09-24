import { useId } from 'react'
import { SectionLabel } from '@/components/section-label'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatPercent } from '@/lib/format'
import { useEditorStore } from '@/state/editor-store'
import type { Layer } from '@/state/layer'
import { RangeControl } from '@/components/range-control'
import { TargetChip } from './TargetChip'

export function SelectionControls({ layer }: { layer: Layer }) {
  const coverage = useEditorStore((state) => state.coverage[layer.id] ?? 0)
  const { removeTarget, updateSelection } = useEditorStore.getState()
  const { targets, tolerance, softness, feather, invert } = layer.selection
  const invertId = useId()

  return (
    <section className="grid gap-4">
      <SectionLabel
        aside={<span className="text-xs text-muted-foreground tabular-nums">{formatPercent(coverage)} of image</span>}
      >
        Selection · {layer.name}
      </SectionLabel>

      {targets.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          No colors selected. Click a palette color, or turn on “Pick color” and click the image.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {targets.map((target) => (
            <TargetChip key={target.hex} target={target} onRemove={() => removeTarget(layer.id, target.hex)} />
          ))}
        </div>
      )}

      <RangeControl
        label="Tolerance"
        value={tolerance}
        min={0}
        max={0.4}
        step={0.005}
        onChange={(value) => updateSelection(layer.id, { tolerance: value })}
      />
      <RangeControl
        label="Softness"
        value={softness}
        min={0}
        max={0.2}
        step={0.005}
        onChange={(value) => updateSelection(layer.id, { softness: value })}
      />
      <RangeControl
        label="Edge feather"
        value={feather}
        min={0}
        max={40}
        step={1}
        unit="px"
        onChange={(value) => updateSelection(layer.id, { feather: value })}
      />
      <div className="flex items-center justify-between">
        <Label htmlFor={invertId} className="text-xs font-normal">
          Invert (move everything except these colors)
        </Label>
        <Switch
          id={invertId}
          size="sm"
          checked={invert}
          onCheckedChange={(checked) => updateSelection(layer.id, { invert: checked })}
        />
      </div>
    </section>
  )
}
