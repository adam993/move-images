import { Upload } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/section-label'
import { Button } from '@/components/ui/button'
import { SAMPLE_IMAGES } from '@/lib/image/samples'
import { useEditorStore } from '@/state/editor-store'
import { loadFile, loadSample } from '@/state/image-actions'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/avif'

export function ImagePicker() {
  const imageName = useEditorStore((state) => state.image?.name)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-r border-border bg-sidebar p-4">
      <header>
        <h1 className="text-sm font-semibold">Livefy Images</h1>
        <p className="text-xs text-muted-foreground">Animate stills by color — no AI, all in the browser.</p>
      </header>

      <section>
        <SectionLabel>Samples</SectionLabel>
        <ul className="grid grid-cols-1 gap-1">
          {SAMPLE_IMAGES.map((sample) => (
            <li key={sample.id}>
              <button
                type="button"
                onClick={() => void loadSample(sample)}
                aria-current={imageName === sample.label}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-muted',
                  imageName === sample.label && 'bg-muted ring-1 ring-ring',
                )}
              >
                <img src={sample.src} alt="" className="size-11 shrink-0 rounded object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{sample.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{sample.credit}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>Your image</SectionLabel>
        <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
          <Upload /> Upload image
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void loadFile(file)
            event.target.value = ''
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">…or drop one onto the canvas.</p>
      </section>
    </aside>
  )
}
