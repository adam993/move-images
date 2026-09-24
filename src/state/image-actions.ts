import { errorMessage } from '@/lib/error-message'
import { analyzeImage } from '@/lib/image/analyze-image'
import { loadImageFromFile, loadImageFromUrl } from '@/lib/image/load-image'
import type { LoadedImage } from '@/lib/image/loaded-image'
import type { SampleImage } from '@/lib/image/samples'
import { useEditorStore } from './editor-store'

// Shared by every caller (picker, drag-drop, initial load) so only the most recent request lands.
let latestRequest = 0

async function loadIntoEditor(load: () => Promise<LoadedImage>): Promise<void> {
  const request = ++latestRequest
  useEditorStore.getState().setLoading(true)
  try {
    const image = await load()
    if (request !== latestRequest) {
      image.bitmap.close()
      return
    }
    const analysis = analyzeImage(image.bitmap)
    const previous = useEditorStore.getState().image
    useEditorStore.getState().setImage(image, analysis)
    // The renderer re-uploads from the store's current image, so the replaced bitmap is no longer needed.
    previous?.bitmap.close()
  } catch (cause) {
    // On failure the previous image stays loaded; only the error message changes.
    if (request === latestRequest) useEditorStore.getState().setLoadError(errorMessage(cause))
  }
}

export function loadSample(sample: SampleImage): Promise<void> {
  return loadIntoEditor(() => loadImageFromUrl(sample.src, sample.label))
}

export function loadFile(file: File): Promise<void> {
  return loadIntoEditor(() => loadImageFromFile(file))
}
