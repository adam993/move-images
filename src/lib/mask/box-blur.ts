/** Separable box blur with edge clamping. Returns a new array; `src` is left untouched. */
export function boxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (!Number.isInteger(radius) || radius < 0) {
    throw new Error(`Blur radius must be a non-negative integer, got ${radius}`)
  }
  if (radius === 0) return src.slice()

  const horizontal = new Float32Array(src.length)
  for (let y = 0; y < height; y++) blurLine(src, horizontal, y * width, 1, width, radius)

  const out = new Float32Array(src.length)
  for (let x = 0; x < width; x++) blurLine(horizontal, out, x, width, height, radius)
  return out
}

/** Running-sum box filter along one row or column; `stride` 1 walks a row, `width` walks a column. */
function blurLine(
  src: Float32Array,
  dst: Float32Array,
  start: number,
  stride: number,
  length: number,
  radius: number,
): void {
  const at = (i: number) => src[start + Math.min(length - 1, Math.max(0, i)) * stride]
  const size = 2 * radius + 1

  let sum = 0
  for (let i = -radius; i <= radius; i++) sum += at(i)
  for (let i = 0; i < length; i++) {
    dst[start + i * stride] = sum / size
    sum += at(i + radius + 1) - at(i - radius)
  }
}
