import { describe, expect, it } from 'vitest'
import {
  defaultSettings,
  exportFileName,
  frameCount,
  outputSize,
  withFormat,
  type ExportSettings,
} from './export-settings'

const mp4 = defaultSettings('mp4')
const gif = defaultSettings('gif')

describe('defaultSettings', () => {
  it('uses 4 s, 30 fps, 1920 px and seamless looping for video', () => {
    expect(mp4).toEqual({ format: 'mp4', durationSeconds: 4, fps: 30, maxSide: 1920, seamlessLoop: true })
    expect(defaultSettings('webm').fps).toBe(30)
  })

  it('uses 15 fps and 640 px for GIF', () => {
    expect(gif).toEqual({ format: 'gif', durationSeconds: 4, fps: 15, maxSide: 640, seamlessLoop: true })
  })
})

describe('withFormat', () => {
  it('resets fps and size to GIF defaults when switching from video, keeping duration and loop', () => {
    const custom: ExportSettings = { ...mp4, durationSeconds: 6, seamlessLoop: false }
    expect(withFormat(custom, 'gif')).toEqual({ ...gif, durationSeconds: 6, seamlessLoop: false })
  })

  it('keeps fps and size when switching between video formats', () => {
    const custom: ExportSettings = { ...mp4, fps: 24, maxSide: 720 }
    expect(withFormat(custom, 'webm')).toEqual({ ...custom, format: 'webm' })
  })
})

describe('outputSize', () => {
  it('never upscales', () => {
    expect(outputSize(800, 600, mp4)).toEqual({ width: 800, height: 600 })
  })

  it('caps the long side and rounds video dimensions down to even numbers', () => {
    expect(outputSize(1920, 2689, mp4)).toEqual({ width: 1370, height: 1920 })
    expect(outputSize(1781, 1920, { ...mp4, maxSide: null })).toEqual({ width: 1780, height: 1920 })
    expect(outputSize(1001, 501, { ...mp4, maxSide: null })).toEqual({ width: 1000, height: 500 })
  })

  it('does not force even dimensions for GIF', () => {
    expect(outputSize(1781, 1920, gif)).toEqual({ width: 594, height: 640 })
  })

  it('keeps video dimensions at least 2 px for extreme aspect ratios', () => {
    expect(outputSize(4000, 1, mp4)).toEqual({ width: 1920, height: 2 })
  })
})

describe('frameCount', () => {
  it('is duration × fps, rounded to whole frames', () => {
    expect(frameCount(mp4)).toBe(120)
    expect(frameCount({ ...gif, durationSeconds: 4.5, fps: 25 })).toBe(113)
    expect(frameCount({ ...gif, durationSeconds: 1, fps: 10 })).toBe(10)
  })
})

describe('exportFileName', () => {
  it('slugifies the image name and appends -livefy with the format extension', () => {
    expect(exportFileName('Sea at night', 'mp4')).toBe('sea-at-night-livefy.mp4')
    expect(exportFileName('IMG_01.jpeg', 'gif')).toBe('img_01-livefy.gif')
    expect(exportFileName('../weird name?.png', 'webm')).toBe('weird-name-livefy.webm')
  })

  it('falls back to "image" when nothing usable is left', () => {
    expect(exportFileName('???.png', 'mp4')).toBe('image-livefy.mp4')
  })
})
