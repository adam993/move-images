import { useId } from 'react'
import { SectionLabel } from '@/components/section-label'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { driftEffect, findMatchingPreset, type DriftParams } from '@/effects/drift/definition'
import type { ParamSpec } from '@/effects/types'
import { useEditorStore } from '@/state/editor-store'
import type { Layer } from '@/state/layer'
import { ParamControl } from './ParamControl'

// The control for `spec` only produces values its spec allows, so the patch matches DriftParams.
function paramPatch(spec: ParamSpec<DriftParams>, value: number | string): Partial<DriftParams> {
  return { [spec.key]: value } as Partial<DriftParams>
}

export function MotionControls({ layer }: { layer: Layer }) {
  const { applyPreset, updateParams } = useEditorStore.getState()
  const params = layer.effect.params
  const matchingPreset = findMatchingPreset(params)
  const presetId = useId()

  return (
    <section className="grid gap-4">
      <SectionLabel>Motion · {driftEffect.label}</SectionLabel>

      <div className="grid gap-2">
        <Label htmlFor={presetId} className="text-xs font-normal">
          Preset
        </Label>
        <Select value={matchingPreset?.id ?? ''} onValueChange={(id) => applyPreset(layer.id, id)}>
          <SelectTrigger id={presetId} size="sm" className="w-full">
            <SelectValue placeholder="Custom" />
          </SelectTrigger>
          <SelectContent>
            {driftEffect.presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {driftEffect.params
        .filter((spec) => spec.visibleWhen?.(params) ?? true)
        .map((spec) => (
          <ParamControl
            key={spec.key}
            spec={spec}
            value={params[spec.key]}
            onChange={(value) => updateParams(layer.id, paramPatch(spec, value))}
          />
        ))}
    </section>
  )
}
