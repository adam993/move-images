import { describe, expect, it } from 'vitest'
import { assertImageFile } from './load-image'

describe('assertImageFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])('accepts %s', (type) => {
    expect(() => assertImageFile({ name: 'photo', type })).not.toThrow()
  })

  it('rejects a non-image file with a message naming the file and its type', () => {
    expect(() => assertImageFile({ name: 'notes.txt', type: 'text/plain' })).toThrow(
      /"notes\.txt" is a text\/plain file — choose a JPEG, PNG, WebP or AVIF image/,
    )
  })

  it('rejects a file whose type the browser could not determine', () => {
    expect(() => assertImageFile({ name: 'mystery', type: '' })).toThrow(/"mystery" is of an unknown type/)
  })
})
