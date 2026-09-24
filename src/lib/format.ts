/** Formats a 0–1 share as a percentage for readouts. */
export function formatPercent(share: number): string {
  if (share === 0) return '0%'
  if (share === 1) return '100%'
  if (share < 0.001) return '<0.1%'
  return `${(share * 100).toFixed(1)}%`
}

/** Formats a slider value with the same number of decimals as its step (0.005 → 3, 1 → 0). */
export function formatStepValue(value: number, step: number): string {
  const decimals = (String(step).split('.')[1] ?? '').length
  return value.toFixed(decimals)
}

/** Human-readable file size (1024-based). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
