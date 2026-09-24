import { useEffect, useState } from 'react'
import type { VideoFormat } from '@/export/encode-video'
import { errorMessage } from '@/lib/error-message'

export type VideoSupport = { formats: Record<VideoFormat, boolean>; error: string | null }

/** Which video formats this browser can encode at the given size and frame rate; null while checking. */
export function useVideoSupport(width: number, height: number, fps: number): VideoSupport | null {
  const key = `${width}x${height}@${fps}`
  const [checked, setChecked] = useState<{ key: string; support: VideoSupport } | null>(null)

  useEffect(() => {
    let current = true
    const check = async (): Promise<VideoSupport> => {
      try {
        // Loaded on demand: the encoder library is only needed once the export dialog opens.
        const { videoFormatSupport } = await import('@/export/encode-video')
        return { formats: await videoFormatSupport(width, height, fps), error: null }
      } catch (cause) {
        return { formats: { mp4: false, webm: false }, error: errorMessage(cause) }
      }
    }
    void check().then((support) => {
      if (current) setChecked({ key, support })
    })
    return () => {
      current = false
    }
  }, [key, width, height, fps])

  return checked?.key === key ? checked.support : null
}
