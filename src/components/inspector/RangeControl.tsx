import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { formatStepValue } from '@/lib/format'

type RangeControlProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

export function RangeControl({ label, value, min, max, step, unit, onChange }: RangeControlProps) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs">
        <Label htmlFor={id} className="text-xs font-normal">
          {label}
        </Label>
        <span className="text-muted-foreground tabular-nums">
          {formatStepValue(value, step)}
          {unit}
        </span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  )
}
