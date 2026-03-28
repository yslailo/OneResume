import { deleteDB, openDB } from 'idb'
import type { DBSchema } from 'idb'
import type { StoredPhotoAsset } from '@/domain/types'

interface OneResumeAssetDb extends DBSchema {
  photos: {
    key: string
    value: StoredPhotoAsset
  }
}

const DB_NAME = 'one-resume-assets'
const DB_VERSION = 1

async function getDb() {
  return openDB<OneResumeAssetDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' })
      }
    },
  })
}

export async function savePhotoAsset(asset: StoredPhotoAsset): Promise<void> {
  const db = await getDb()
  await db.put('photos', asset)
}

export async function getPhotoAsset(id: string): Promise<StoredPhotoAsset | undefined> {
  const db = await getDb()
  return db.get('photos', id)
}

export async function deletePhotoAsset(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('photos', id)
}

export async function clearAssets(): Promise<void> {
  await deleteDB(DB_NAME)
}
