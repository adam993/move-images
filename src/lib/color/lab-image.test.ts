import { describe, expect, it } from 'vitest'
import { labAt, labImageFromRgba } from './lab-image'
import { rgbToOklab } from './oklab'

describe('labImageFromRgba', () => {
  it('converts every pixel to OKLab and reads it back by coordinate', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255])
    const image = labImageFromRgba(rgba, 2, 1)

    expect(image.width).toBe(2)
    expect(image.height).toBe(1)
    const red = rgbToOklab(255, 0, 0)
    const blue = rgbToOklab(0, 0, 255)
    labAt(image, 0, 0).forEach((v, i) => expect(v).toBeCloseTo(red[i], 5))
    labAt(image, 1, 0).forEach((v, i) => expect(v).toBeCloseTo(blue[i], 5))
  })

  it('clamps out-of-range coordinates to the nearest edge pixel', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255])
    const image = labImageFromRgba(rgba, 2, 1)
    expect(labAt(image, -5, 3)).toEqual(labAt(image, 0, 0))
    expect(labAt(image, 99, 0)).toEqual(labAt(image, 1, 0))
  })

  it('rejects a buffer whose length does not match the dimensions', () => {
    expect(() => labImageFromRgba(new Uint8ClampedArray(12), 2, 2)).toThrow(/expected 16/)
  })
})
