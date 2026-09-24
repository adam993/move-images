export type EncodeOptions = {
  fps: number
  frameCount: number
  signal: AbortSignal
  /** Fraction of frames encoded so far, 0–1. */
  onProgress: (fraction: number) => void
}
