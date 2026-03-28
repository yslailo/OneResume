import type { ResumeDocument, ResumeExportFile, StoredPhotoAsset } from '@/domain/types'
import { createImportedResume, migrateResumeDocument } from '@/domain/resume'

export async function photoAssetToDataUrl(photo?: StoredPhotoAsset): Promise<string | undefined> {
  if (!photo) {
    return undefined
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(photo.blob)
  })
}

export async function exportResumeToJson(
  resume: ResumeDocument,
  photo?: StoredPhotoAsset,
): Promise<ResumeExportFile> {
  const photoDataUrl = await photoAssetToDataUrl(photo)

  return {
    version: 1,
    resume,
    assetsMeta: {
      hasPhoto: Boolean(photo),
      photoContentType: photo?.blob.type,
    },
    photoDataUrl,
  }
}

export function importResumeFromJson(
  payload: ResumeExportFile,
  existingTitles: string[],
): {
  resume: ResumeDocument
  photoDataUrl?: string
} {
  const resume = createImportedResume(migrateResumeDocument(payload.resume), existingTitles)

  return {
    resume,
    photoDataUrl: payload.assetsMeta.hasPhoto ? payload.photoDataUrl : undefined,
  }
}
