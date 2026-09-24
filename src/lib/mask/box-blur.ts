/** Separable box blur with edge clamping. Returns a new array; `src` is left untouched. */
export function boxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (!Number.isInteger(radius) || radius < 0) {
    throw new Error(`Blur radius must be a non-negative integer, got ${radius}`)
  }
  if (radius === 0) return src.slice()

  const horizontal = new Float32Array(src.length)
  for (let y = 0; y < height; y++) blurRow(src, horizontal, y * width, width, radius)

  const out = new Float32Array(src.length)
  blurColumns(horizontal, out, width, height, radius)
  return out
}

function blurRow(src: Float32Array, dst: Float32Array, offset: number, length: number, radius: number): void {
  const last = length - 1
  const scale = 1 / (2 * radius + 1)

  let sum = 0
  for (let i = -radius; i <= radius; i++) sum += src[offset + (i < 0 ? 0 : i > last ? last : i)]
  for (let i = 0; i < length; i++) {
    dst[offset + i] = sum * scale
    const add = i + radius + 1
    const remove = i - radius
    sum += src[offset + (add > last ? last : add)] - src[offset + (remove < 0 ? 0 : remove)]
  }
}

/**
 * Vertical pass over whole rows with one running sum per column: walking memory row by row is several
 * times faster than striding down each column.
 */
function blurColumns(src: Float32Array, dst: Float32Array, width: number, height: number, radius: number): void {
  const last = height - 1
  const scale = 1 / (2 * radius + 1)
  const sums = new Float64Array(width)

  for (let i = -radius; i <= radius; i++) {
    const row = (i < 0 ? 0 : i > last ? last : i) * width
    for (let x = 0; x < width; x++) sums[x] += src[row + x]
  }
  for (let y = 0; y < height; y++) {
    const outRow = y * width
    const addRow = Math.min(last, y + radius + 1) * width
    const removeRow = Math.max(0, y - radius) * width
    for (let x = 0; x < width; x++) {
      dst[outRow + x] = sums[x] * scale
      sums[x] += src[addRow + x] - src[removeRow + x]
    }
  }
}
