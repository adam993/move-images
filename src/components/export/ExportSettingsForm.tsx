import { useId } from 'react'
import { RangeControl } from '@/components/range-control'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DURATION,
  FORMAT_INFO,
  FPS_OPTIONS,
  SIZE_OPTIONS,
  withFormat,
  type ExportFormat,
  type ExportSettings,
} from '@/export/export-settings'
import type { VideoSupport } from '@/hooks/use-video-support'

const FORMATS: readonly ExportFormat[] = ['mp4', 'webm', 'gif']
const ORIGINAL = 'original'

type ExportSettingsFormProps = {
  settings: ExportSettings
  onChange: (settings: ExportSettings) => void
  imageSize: { width: number; height: number }
  videoSupport: VideoSupport | null
  disabled: boolean
}

export function ExportSettingsForm({ settings, onChange, imageSize, videoSupport, disabled }: ExportSettingsFormProps) {
  const kind = FORMAT_INFO[settings.format].kind
  const fpsId = useId()
  const sizeId = useId()
  const loopId = useId()
  const unsupported = (format: ExportFormat) =>
    FORMAT_INFO[format].kind === 'video' && videoSupport !== null && !videoSupport.formats[format as 'mp4' | 'webm']
  const unsupportedLabels = FORMATS.filter(unsupported).map((format) => FORMAT_INFO[format].label)

  return (
    <fieldset disabled={disabled} className="grid gap-4">
      <div className="grid gap-2">
        <Label className="text-xs font-normal">Format</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={settings.format}
          aria-label="Format"
          onValueChange={(value) => {
            const format = FORMATS.find((candidate) => candidate === value)
            if (format) onChange(withFormat(settings, format))
          }}
        >
          {FORMATS.map((format) => (
            <ToggleGroupItem key={format} value={format} disabled={unsupported(format)}>
              {FORMAT_INFO[format].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* Visible text, not a tooltip: disabled toggles ignore the pointer, so a title would never show. */}
        {unsupportedLabels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            This browser can't encode {unsupportedLabels.join(' or ')} at this size
            {videoSupport?.error ? ` (${videoSupport.error})` : ''}.
          </p>
        )}
      </div>

      <RangeControl
        label="Duration"
        value={settings.durationSeconds}
        min={DURATION.min}
        max={DURATION.max}
        step={DURATION.step}
        unit=" s"
        onChange={(durationSeconds) => onChange({ ...settings, durationSeconds })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={fpsId} className="text-xs font-normal">
            Frame rate
          </Label>
          <Select value={String(settings.fps)} onValueChange={(value) => onChange({ ...settings, fps: Number(value) })}>
            <SelectTrigger id={fpsId} size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FPS_OPTIONS[kind].map((fps) => (
                <SelectItem key={fps} value={String(fps)}>
                  {fps} fps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={sizeId} className="text-xs font-normal">
            Size (long side)
          </Label>
          <Select
            value={String(settings.maxSide ?? ORIGINAL)}
            onValueChange={(value) => onChange({ ...settings, maxSide: value === ORIGINAL ? null : Number(value) })}
          >
            <SelectTrigger id={sizeId} size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS[kind].map((maxSide) => (
                <SelectItem key={maxSide ?? ORIGINAL} value={String(maxSide ?? ORIGINAL)}>
                  {maxSide === null ? `Original (${Math.max(imageSize.width, imageSize.height)} px)` : `${maxSide} px`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <Label htmlFor={loopId} className="grid gap-1 text-xs font-normal">
          Seamless loop
          <span className="text-muted-foreground">Speeds snap to whole cycles so the end flows into the start.</span>
        </Label>
        <Switch
          id={loopId}
          size="sm"
          checked={settings.seamlessLoop}
          onCheckedChange={(seamlessLoop) => onChange({ ...settings, seamlessLoop })}
        />
      </div>
    </fieldset>
  )
}
