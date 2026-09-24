import { Pause, Pipette, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEditorStore, type ViewMode } from '@/state/editor-store'

const VIEW_OPTIONS: readonly { value: ViewMode; label: string }[] = [
  { value: 'animated', label: 'Animated' },
  { value: 'mask', label: 'Mask' },
  { value: 'original', label: 'Original' },
]

export function StageToolbar() {
  const playing = useEditorStore((state) => state.playing)
  const view = useEditorStore((state) => state.view)
  const eyedropper = useEditorStore((state) => state.eyedropper)
  const image = useEditorStore((state) => state.image)
  const { togglePlaying, setView, setEyedropper } = useEditorStore.getState()

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
      <Button variant="secondary" size="sm" className="w-20" onClick={togglePlaying}>
        {playing ? <Pause /> : <Play />}
        {playing ? 'Pause' : 'Play'}
      </Button>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={view}
        aria-label="View"
        onValueChange={(value) => {
          const option = VIEW_OPTIONS.find((candidate) => candidate.value === value)
          if (option) setView(option.value)
        }}
      >
        {VIEW_OPTIONS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Toggle variant="outline" size="sm" pressed={eyedropper} onPressedChange={setEyedropper}>
        <Pipette /> Pick color
      </Toggle>

      {image && (
        <p className="ml-auto truncate text-xs text-muted-foreground tabular-nums">
          {image.name} · {image.width}×{image.height}
        </p>
      )}
    </div>
  )
}
