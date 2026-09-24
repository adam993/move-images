import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
  canEncodeVideo,
  type VideoCodec,
} from 'mediabunny'
import type { EncodeOptions } from './encode-options'
import { FORMAT_INFO } from './export-settings'
import { yieldToBrowser } from './yield-to-browser'

export type VideoFormat = 'mp4' | 'webm'

const CODECS: Record<VideoFormat, VideoCodec> = { mp4: 'avc', webm: 'vp9' }

/** Whether this browser can encode each video format at the given size and frame rate. */
export async function videoFormatSupport(
  width: number,
  height: number,
  fps: number,
): Promise<Record<VideoFormat, boolean>> {
  const check = (format: VideoFormat) =>
    canEncodeVideo(CODECS[format], { width, height, frameRate: fps, quality: QUALITY_HIGH })
  const [mp4, webm] = await Promise.all([check('mp4'), check('webm')])
  return { mp4, webm }
}

/** Encodes `frameCount` frames drawn by `renderFrame` onto `canvas` into an MP4 (H.264) or WebM (VP9) file. */
export async function encodeVideo(
  canvas: OffscreenCanvas,
  renderFrame: (index: number) => void,
  options: EncodeOptions & { format: VideoFormat },
): Promise<Blob> {
  const { format, fps, frameCount, signal, onProgress } = options
  const output = new Output({
    // In-memory fast start puts the index first, so the MP4 can start playing before it fully downloads.
    format: format === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(),
    target: new BufferTarget(),
  })
  const source = new CanvasSource(canvas, { codec: CODECS[format], quality: QUALITY_HIGH })
  output.addVideoTrack(source, { frameRate: fps })
  await output.start()

  try {
    for (let index = 0; index < frameCount; index++) {
      signal.throwIfAborted()
      renderFrame(index)
      // Captures the canvas immediately; awaiting applies encoder backpressure.
      await source.add(index / fps, 1 / fps)
      onProgress((index + 1) / frameCount)
      await yieldToBrowser()
    }
    await output.finalize()
  } catch (error) {
    if (output.state === 'started') await output.cancel()
    throw error
  }

  const buffer = output.target.buffer
  if (!buffer) throw new Error('The video encoder finished without producing a file')
  return new Blob([buffer], { type: FORMAT_INFO[format].mimeType })
}
