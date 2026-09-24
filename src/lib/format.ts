/** Formats a 0–1 share as a percentage for readouts. */
export function formatPercent(share: number): string {
  if (share === 0) return '0%'
  if (share === 1) return '100%'
  if (share < 0.001) return '<0.1%'
  return `${(share * 100).toFixed(1)}%`
}
