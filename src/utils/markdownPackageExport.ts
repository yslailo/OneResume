import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export interface MarkdownPackageImage {
  name: string
  blob: Blob
}

export interface MarkdownPackageExtraFile {
  name: string
  content: string
}

export function extensionFromMimeType(contentType?: string): string {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'png'
}

interface BuildMarkdownPackageOptions {
  markdown: string
  images: MarkdownPackageImage[]
  extraFiles?: MarkdownPackageExtraFile[]
}

interface DownloadMarkdownPackageOptions extends BuildMarkdownPackageOptions {
  zipFileName: string
}

export async function buildMarkdownPackageBlob(options: BuildMarkdownPackageOptions): Promise<Blob> {
  const zip = new JSZip()
  zip.file('README.md', options.markdown)

  const imageFolder = zip.folder('images')
  options.images.forEach((image) => {
    imageFolder?.file(image.name, image.blob)
  })

  options.extraFiles?.forEach((file) => {
    zip.file(file.name, file.content)
  })

  return zip.generateAsync({ type: 'blob' })
}

export async function downloadMarkdownPackage(options: DownloadMarkdownPackageOptions): Promise<void> {
  const blob = await buildMarkdownPackageBlob(options)
  saveAs(blob, options.zipFileName)
}
