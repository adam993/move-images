import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExportJob, ExportResult } from '@/export/export-animation'
import { downloadBlob } from '@/lib/download'
import { errorMessage } from '@/lib/error-message'

export type ExportStatus =
  | { kind: 'idle' }
  | { kind: 'running'; progress: number }
  | { kind: 'done'; result: ExportResult }
  | { kind: 'error'; message: string }

/** Runs one export at a time, downloads the result, and aborts the export if the owner unmounts. */
export function useExportJob() {
  const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const start = useCallback(async (job: ExportJob) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus({ kind: 'running', progress: 0 })

    try {
      // The encoders are large and only needed here, so they load on first export.
      const { exportAnimation } = await import('@/export/export-animation')
      const result = await exportAnimation(job, controller.signal, (progress) =>
        setStatus({ kind: 'running', progress }),
      )
      downloadBlob(result.blob, result.fileName)
      setStatus({ kind: 'done', result })
    } catch (cause) {
      // Cancelling is a user choice, not a failure.
      setStatus(controller.signal.aborted ? { kind: 'idle' } : { kind: 'error', message: errorMessage(cause) })
    }
  }, [])

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const reset = useCallback(() => setStatus({ kind: 'idle' }), [])

  return { status, start, cancel, reset }
}
