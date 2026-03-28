import { describe, expect, it } from 'vitest'

import {
  STANDARD_TWO_INCH_PHOTO_HEIGHT,
  STANDARD_TWO_INCH_PHOTO_RATIO,
  STANDARD_TWO_INCH_PHOTO_WIDTH,
  getCenteredCropBox,
} from '@/utils/images'

describe('images', () => {
  it('uses the common two-inch photo ratio', () => {
    expect(STANDARD_TWO_INCH_PHOTO_RATIO).toBeCloseTo(35 / 49)
    expect(STANDARD_TWO_INCH_PHOTO_WIDTH).toBe(560)
    expect(STANDARD_TWO_INCH_PHOTO_HEIGHT).toBe(784)
  })

  it('crops wide images from the horizontal center', () => {
    const cropBox = getCenteredCropBox(1600, 900)

    expect(cropBox.sourceX).toBeCloseTo(478.57, 2)
    expect(cropBox.sourceY).toBe(0)
    expect(cropBox.sourceWidth).toBeCloseTo(642.86, 2)
    expect(cropBox.sourceHeight).toBe(900)
  })

  it('crops tall images from the vertical center', () => {
    const cropBox = getCenteredCropBox(900, 1600)

    expect(cropBox.sourceX).toBe(0)
    expect(cropBox.sourceY).toBeCloseTo(170, 2)
    expect(cropBox.sourceWidth).toBe(900)
    expect(cropBox.sourceHeight).toBeCloseTo(1260, 2)
  })
})
