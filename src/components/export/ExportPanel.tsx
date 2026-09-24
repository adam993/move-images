import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { exportTiming } from '@/export/export-timing'
import { FORMAT_INFO, defaultSettings, outputSize, withFormat } from '@/export/export-settings'
import type { LoopAdjustment } from '@/export/loop-timing'
import type { useExportJob } from '@/hooks/use-export-job'
import { useVideoSupport } from '@/hooks/use-video-support'
import type { LoadedImage } from '@/lib/image/loaded-image'
import { useEditorStore } from '@/state/editor-store'
import { ExportSettingsForm } from './ExportSettingsForm'
import { ExportStatusView } from './ExportStatusView'

const formatAdjustment = ({ layerName, param, from, to }: LoopAdjustment) =>
  `${layerName}: ${from.toFixed(2)} → ${to.toFixed(2)} ${param === 'speed' ? 'Hz' : 'jumps/s'}`

export function ExportPanel({ image, job }: { image: LoadedImage; job: ReturnType<typeof useExportJob> }) {
  const layers = useEditorStore((state) => state.layers)
  const [settings, setSettings] = useState(() => defaultSettings('mp4'))
  const running = job.status.kind === 'running'

  const size = outputSize(image.width, image.height, settings)
  const { frames, loopSeconds, adjustments } = exportTiming(settings, layers)
  // Video support is checked at the size and rate a video export would use, even while GIF is selected.
  const videoSettings = FORMAT_INFO[settings.format].kind === 'video' ? settings : withFormat(settings, 'mp4')
  const videoSize = outputSize(image.width, image.height, videoSettings)
  const videoSupport = useVideoSupport(videoSize.width, videoSize.height, videoSettings.fps)

  const isVideo = FORMAT_INFO[settings.format].kind === 'video'
  const checking = isVideo && videoSupport === null
  const blocked = isVideo && videoSupport !== null && !videoSupport.formats[settings.format as 'mp4' | 'webm']

  const start = () => {
    const { image: current, analysis, layers: currentLayers } = useEditorStore.getState()
    if (!current || !analysis) throw new Error('Export started without a loaded image')
    void job.start({ settings, image: current, analysis, layers: currentLayers })
  }

  return (
    <>
      <ExportSettingsForm
        settings={settings}
        onChange={(next) => {
          setSettings(next)
          if (job.status.kind !== 'running') job.reset()
        }}
        imageSize={image}
        videoSupport={videoSupport}
        disabled={running}
      />

      <div className="grid gap-1 text-xs text-muted-foreground tabular-nums" data-testid="export-summary">
        <p>
          {size.width}×{size.height} · {frames} frames · {loopSeconds.toFixed(2)} s
        </p>
        {settings.seamlessLoop && adjustments.length > 0 && (
          <p>Adjusted for a seamless loop: {adjustments.map(formatAdjustment).join('; ')}</p>
        )}
        {blocked && (
          <p className="text-destructive">
            This browser can't encode {FORMAT_INFO[settings.format].label} at this size.
            {videoSupport?.error && ` (${videoSupport.error})`}
          </p>
        )}
      </div>

      <ExportStatusView status={job.status} />

      <DialogFooter>
        {running ? (
          <Button variant="outline" onClick={job.cancel}>
            Cancel
          </Button>
        ) : (
          <Button onClick={start} disabled={checking || blocked}>
            {checking ? 'Checking encoder…' : `Export ${FORMAT_INFO[settings.format].label}`}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
