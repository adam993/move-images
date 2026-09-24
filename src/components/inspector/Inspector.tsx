import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { selectActiveLayer, useEditorStore } from '@/state/editor-store'
import { LayerList } from './LayerList'
import { MotionControls } from './MotionControls'
import { PalettePanel } from './PalettePanel'
import { SelectionControls } from './SelectionControls'

export function Inspector() {
  const activeLayer = useEditorStore(selectActiveLayer)

  return (
    <aside className="min-h-0 border-l border-border bg-sidebar">
      <ScrollArea className="h-full">
        <div className="grid gap-5 p-4">
          <PalettePanel />
          <Separator />
          <LayerList />
          {activeLayer && (
            <>
              <Separator />
              <SelectionControls layer={activeLayer} />
              <Separator />
              <MotionControls layer={activeLayer} />
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
