import { errorMessage } from '@/lib/error-message'
import { fitWithin } from './fit-within'
import type { LoadedImage } from './loaded-image'

/** Long-side cap for the GPU source texture; 4096 is supported by effectively every WebGL2 device. */
export const MAX_SOURCE_SIDE = 4096

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function assertImageFile(file: { name: string; type: string }): void {
  if (SUPPORTED_TYPES.includes(file.type)) return
  const kind = file.type ? `a ${file.type} file` : 'of an unknown type'
  throw new Error(`"${file.name}" is ${kind} — choose a JPEG, PNG, WebP or AVIF image.`)
}

export async function loadImageFromUrl(url: string, name: string): Promise<LoadedImage> {
  let response: Response
  try {
    response = await fetch(url)
  } catch (cause) {
    throw new Error(`Could not fetch "${name}": ${errorMessage(cause)}`, { cause })
  }
  if (!response.ok) throw new Error(`Could not fetch "${name}": HTTP ${response.status}`)
  return decode(await response.blob(), name)
}

export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  assertImageFile(file)
  return decode(file, file.name)
}

async function decode(blob: Blob, name: string): Promise<LoadedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
    const fitted = fitWithin(bitmap.width, bitmap.height, MAX_SOURCE_SIDE)
    if (fitted.width !== bitmap.width || fitted.height !== bitmap.height) {
      bitmap.close()
      bitmap = await createImageBitmap(blob, {
        resizeWidth: fitted.width,
        resizeHeight: fitted.height,
        resizeQuality: 'high',
      })
    }
  } catch (cause) {
    throw new Error(`Could not decode "${name}": ${errorMessage(cause)}`, { cause })
  }
  return { id: crypto.randomUUID(), name, bitmap, width: bitmap.width, height: bitmap.height }
}
