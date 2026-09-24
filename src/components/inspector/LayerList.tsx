import { Copy, Plus, Trash2 } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ColorSwatch } from '@/components/color-swatch'
import { findMatchingPreset } from '@/effects/drift/definition'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MAX_LAYERS } from '@/render/limits'
import { useEditorStore } from '@/state/editor-store'

const MAX_DOTS = 5

export function LayerList() {
  const layers = useEditorStore((state) => state.layers)
  const activeLayerId = useEditorStore((state) => state.activeLayerId)
  const coverage = useEditorStore((state) => state.coverage)
  const { addLayer, duplicateLayer, removeLayer, setActiveLayer, toggleLayerEnabled } = useEditorStore.getState()
  const full = layers.length >= MAX_LAYERS

  return (
    <section>
      <SectionLabel
        aside={
          <Button size="xs" variant="ghost" onClick={addLayer} disabled={full}>
            <Plus /> Add layer
          </Button>
        }
      >
        Layers · {layers.length}/{MAX_LAYERS}
      </SectionLabel>

      {layers.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          No layers. Add one to start animating.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-1">
        {layers.map((layer) => {
          const active = layer.id === activeLayerId
          const targets = layer.selection.targets
          return (
            <li
              key={layer.id}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2 py-1.5',
                active ? 'border-ring bg-muted' : 'border-transparent hover:bg-muted/60',
              )}
            >
              <Switch
                size="sm"
                checked={layer.enabled}
                onCheckedChange={() => toggleLayerEnabled(layer.id)}
                aria-label={`${layer.enabled ? 'Disable' : 'Enable'} ${layer.name}`}
              />
              <button
                type="button"
                className="grid min-w-0 flex-1 gap-0.5 text-left"
                onClick={() => setActiveLayer(layer.id)}
                aria-current={active}
              >
                <span className="flex items-center gap-2">
                  <span className={cn('truncate text-sm', !layer.enabled && 'text-muted-foreground line-through')}>
                    {layer.name}
                  </span>
                  <span className="flex -space-x-1">
                    {targets.slice(0, MAX_DOTS).map((target) => (
                      <ColorSwatch key={target.hex} hex={target.hex} className="size-3 rounded-full" />
                    ))}
                  </span>
                  {targets.length > MAX_DOTS && (
                    <span className="text-[10px] text-muted-foreground">+{targets.length - MAX_DOTS}</span>
                  )}
                </span>
                <span className="truncate text-[11px] text-muted-foreground tabular-nums">
                  {findMatchingPreset(layer.effect.params)?.label ?? 'Custom'} · {formatPercent(coverage[layer.id] ?? 0)}{' '}
                  selected
                </span>
              </button>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Duplicate ${layer.name}`}
                onClick={() => duplicateLayer(layer.id)}
                disabled={full}
              >
                <Copy />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label={`Delete ${layer.name}`} onClick={() => removeLayer(layer.id)}>
                <Trash2 />
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
