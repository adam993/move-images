// gifenc ships no type declarations; these cover the parts this app uses (see its README "API" section).
declare module 'gifenc' {
  export type GifColorFormat = 'rgb565' | 'rgb444' | 'rgba4444'
  export type GifPalette = number[][]

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: GifColorFormat },
  ): GifPalette

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: GifColorFormat,
  ): Uint8Array

  export type GifFrameOptions = {
    palette?: GifPalette
    /** Frame delay in milliseconds (stored in 10 ms units). */
    delay?: number
    /** 0 = loop forever, -1 = play once. */
    repeat?: number
  }

  export type GifStream = {
    writeFrame(index: Uint8Array, width: number, height: number, options?: GifFrameOptions): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
  }

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): GifStream
}
