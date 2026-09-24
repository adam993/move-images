/** A decoded image ready for GPU upload and analysis. `id` changes on every load, even of the same file. */
export type LoadedImage = {
  id: string
  name: string
  bitmap: ImageBitmap
  width: number
  height: number
}
