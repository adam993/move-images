import { X } from 'lucide-react'
import { ColorSwatch } from '@/components/color-swatch'
import type { TargetColor } from '@/lib/mask/selection'

export function TargetChip({ target, onRemove }: { target: TargetColor; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background py-0.5 pr-0.5 pl-1.5 text-xs tabular-nums">
      <ColorSwatch hex={target.hex} className="size-3.5" />
      {target.hex}
      <button
        type="button"
        aria-label={`Remove ${target.hex}`}
        onClick={onRemove}
        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
