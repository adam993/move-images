import type { Layer } from '@/state/layer'
import { frameCount, type ExportSettings } from './export-settings'
import { loopLayers } from './loop-timing'

/** Seconds per loop and the layers to render, with speeds snapped when seamless looping is on. */
export function exportTiming(settings: ExportSettings, layers: readonly Layer[]) {
  const frames = frameCount(settings)
  const loopSeconds = frames / settings.fps
  const looped = settings.seamlessLoop ? loopLayers(layers, loopSeconds) : { layers: [...layers], adjustments: [] }
  return { frames, loopSeconds, ...looped }
}
