import type { Lab } from '@/lib/color/oklab'

/** A color a layer targets; `hex` identifies it in the UI and for toggling. */
export type TargetColor = { lab: Lab; hex: string }

export type Selection = {
  targets: readonly TargetColor[]
  /** OKLab distance within which a pixel is fully selected. */
  tolerance: number
  /** Extra OKLab distance over which selection fades from 1 to 0. */
  softness: number
  /** Spatial edge blur, in reference px (see lib/units.ts). */
  feather: number
  invert: boolean
}
