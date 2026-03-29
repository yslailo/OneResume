import { createId } from '@/domain/resume'
import type { StoredPhotoAsset } from '@/domain/types'

export const STANDARD_TWO_INCH_PHOTO_RATIO = 35 / 49
export const STANDARD_TWO_INCH_PHOTO_WIDTH = 560
export const STANDARD_TWO_INCH_PHOTO_HEIGHT = 784

export interface CropBox {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片转换失败'))
        return
      }
      resolve(blob)
    }, type)
  })
}

export function getCenteredCropBox(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio = STANDARD_TWO_INCH_PHOTO_RATIO,
): CropBox {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('图片尺寸无效')
  }

  const sourceRatio = sourceWidth / sourceHeight
  if (sourceRatio > targetRatio) {
    const cropWidth = sourceHeight * targetRatio
    return {
      sourceX: (sourceWidth - cropWidth) / 2,
      sourceY: 0,
      sourceWidth: cropWidth,
      sourceHeight,
    }
  }

  const cropHeight = sourceWidth / targetRatio
  return {
    sourceX: 0,
    sourceY: (sourceHeight - cropHeight) / 2,
    sourceWidth,
    sourceHeight: cropHeight,
  }
}

export async function cropImageToStandardPhoto(file: File): Promise<StoredPhotoAsset> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const cropBox = getCenteredCropBox(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = STANDARD_TWO_INCH_PHOTO_WIDTH
    canvas.height = STANDARD_TWO_INCH_PHOTO_HEIGHT
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('浏览器不支持图片裁剪')
    }

    context.drawImage(
      image,
      cropBox.sourceX,
      cropBox.sourceY,
      cropBox.sourceWidth,
      cropBox.sourceHeight,
      0,
      0,
      STANDARD_TWO_INCH_PHOTO_WIDTH,
      STANDARD_TWO_INCH_PHOTO_HEIGHT,
    )
    const blob = await canvasToBlob(canvas, file.type || 'image/png')

    return {
      id: createId('photo'),
      blob,
      createdAt: new Date().toISOString(),
      width: STANDARD_TWO_INCH_PHOTO_WIDTH,
      height: STANDARD_TWO_INCH_PHOTO_HEIGHT,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function dataUrlToPhotoAsset(dataUrl: string): Promise<StoredPhotoAsset> {
  const image = await loadImage(dataUrl)
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  return {
    id: createId('photo'),
    blob,
    createdAt: new Date().toISOString(),
    width: image.width,
    height: image.height,
  }
}

export async function blobToPhotoAsset(blob: Blob): Promise<StoredPhotoAsset> {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)

    return {
      id: createId('photo'),
      blob,
      createdAt: new Date().toISOString(),
      width: image.width,
      height: image.height,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
