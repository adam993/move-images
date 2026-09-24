import { fitWithin } from '@/lib/image/fit-within'

export type ExportFormat = 'mp4' | 'webm' | 'gif'
type FormatKind = 'video' | 'gif'

export type ExportSettings = {
  format: ExportFormat
  durationSeconds: number
  fps: number
  /** Long-side cap in px; null keeps the source size. */
  maxSide: number | null
  seamlessLoop: boolean
}

export const FORMAT_INFO: Record<
  ExportFormat,
  { label: string; extension: string; mimeType: string; kind: FormatKind }
> = {
  mp4: { label: 'MP4', extension: 'mp4', mimeType: 'video/mp4', kind: 'video' },
  webm: { label: 'WebM', extension: 'webm', mimeType: 'video/webm', kind: 'video' },
  gif: { label: 'GIF', extension: 'gif', mimeType: 'image/gif', kind: 'gif' },
}

/** GIF stops at 25 fps: browsers clamp shorter GIF frame delays, which would slow playback down. */
export const FPS_OPTIONS: Record<FormatKind, readonly number[]> = {
  video: [24, 30, 60],
  gif: [10, 15, 20, 25],
}

/** GIF sizes stay small because every frame is stored as a full 256-color image. */
export const SIZE_OPTIONS: Record<FormatKind, readonly (number | null)[]> = {
  video: [null, 1920, 1280, 720],
  gif: [800, 640, 480, 320],
}

export const DURATION = { min: 1, max: 20, step: 0.5 } as const

const KIND_DEFAULTS: Record<FormatKind, { fps: number; maxSide: number }> = {
  video: { fps: 30, maxSide: 1920 },
  gif: { fps: 15, maxSide: 640 },
}

export function defaultSettings(format: ExportFormat): ExportSettings {
  return { format, durationSeconds: 4, seamlessLoop: true, ...KIND_DEFAULTS[FORMAT_INFO[format].kind] }
}

/** Switches format, keeping duration and looping; fps and size fall back to defaults if the new kind lacks them. */
export function withFormat(settings: ExportSettings, format: ExportFormat): ExportSettings {
  const kind = FORMAT_INFO[format].kind
  const defaults = KIND_DEFAULTS[kind]
  return {
    ...settings,
    format,
    fps: FPS_OPTIONS[kind].includes(settings.fps) ? settings.fps : defaults.fps,
    maxSide: SIZE_OPTIONS[kind].includes(settings.maxSide) ? settings.maxSide : defaults.maxSide,
  }
}

/** Export dimensions: capped by `maxSide`, never upscaled; video rounds down to even sizes (4:2:0 chroma needs them). */
export function outputSize(width: number, height: number, settings: ExportSettings): { width: number; height: number } {
  const fitted = fitWithin(width, height, settings.maxSide ?? Math.max(width, height))
  if (FORMAT_INFO[settings.format].kind === 'gif') return fitted
  const even = (value: number) => Math.max(2, value - (value % 2))
  return { width: even(fitted.width), height: even(fitted.height) }
}

export function frameCount(settings: ExportSettings): number {
  return Math.round(settings.durationSeconds * settings.fps)
}

export function exportFileName(imageName: string, format: ExportFormat): string {
  const slug = imageName
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'image'}-livefy.${FORMAT_INFO[format].extension}`
}
