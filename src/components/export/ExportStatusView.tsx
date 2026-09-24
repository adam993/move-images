import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ExportStatus } from '@/hooks/use-export-job'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'

export function ExportStatusView({ status }: { status: ExportStatus }) {
  if (status.kind === 'running') {
    return (
      <div className="grid gap-2" aria-live="polite">
        <Progress value={status.progress * 100} aria-label="Export progress" />
        <p className="text-xs text-muted-foreground tabular-nums">Rendering… {Math.round(status.progress * 100)}%</p>
      </div>
    )
  }

  if (status.kind === 'done') {
    const { result } = status
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
        <span className="min-w-0 truncate" data-testid="export-done">
          Downloaded <span className="font-medium">{result.fileName}</span> · {formatBytes(result.blob.size)}
        </span>
        <Button size="xs" variant="ghost" onClick={() => downloadBlob(result.blob, result.fileName)}>
          Download again
        </Button>
      </div>
    )
  }

  if (status.kind === 'error') {
    return (
      <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs">
        Export failed: {status.message}
      </p>
    )
  }

  return null
}
