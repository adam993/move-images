import { useEffect } from 'react'
import { Inspector } from '@/components/inspector/Inspector'
import { ImagePicker } from '@/components/sidebar/ImagePicker'
import { CanvasStage } from '@/components/stage/CanvasStage'
import { HoverReadout } from '@/components/stage/HoverReadout'
import { StageToolbar } from '@/components/stage/StageToolbar'
import { SAMPLE_IMAGES } from '@/lib/image/samples'
import { loadSample } from '@/state/image-actions'

export default function App() {
  useEffect(() => {
    void loadSample(SAMPLE_IMAGES[0])
  }, [])

  return (
    <div className="grid h-dvh grid-cols-[240px_minmax(0,1fr)_340px] overflow-hidden">
      <ImagePicker />
      <main className="flex min-h-0 min-w-0 flex-col">
        <StageToolbar />
        <CanvasStage />
        <HoverReadout />
      </main>
      <Inspector />
    </div>
  )
}
