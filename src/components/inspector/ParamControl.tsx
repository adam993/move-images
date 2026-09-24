import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ParamSpec } from '@/effects/types'
import { RangeControl } from '@/components/range-control'

type ParamControlProps<P> = {
  spec: ParamSpec<P>
  value: number | string
  onChange: (value: number | string) => void
}

/** Renders the control a param spec describes; new effect types get their UI from their schema alone. */
export function ParamControl<P>({ spec, value, onChange }: ParamControlProps<P>) {
  const id = useId()

  if (spec.kind === 'range') {
    return (
      <RangeControl
        label={spec.label}
        value={Number(value)}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        unit={spec.unit}
        onChange={onChange}
      />
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-normal">
        {spec.label}
      </Label>
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {spec.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
