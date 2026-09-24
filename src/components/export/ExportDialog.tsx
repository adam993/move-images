import { Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useExportJob } from '@/hooks/use-export-job'
import { useEditorStore } from '@/state/editor-store'
import { ExportPanel } from './ExportPanel'

export function ExportDialog() {
  const image = useEditorStore((state) => state.image)
  const [open, setOpen] = useState(false)
  const job = useExportJob()
  const running = job.status.kind === 'running'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-export would silently throw the work away; Cancel is the explicit way out.
        if (!next && running) return
        setOpen(next)
        if (!next) job.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" disabled={!image}>
          <Download /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export animation</DialogTitle>
          <DialogDescription>Every frame is rendered at full quality, then the file downloads.</DialogDescription>
        </DialogHeader>
        {image && <ExportPanel image={image} job={job} />}
      </DialogContent>
    </Dialog>
  )
}
