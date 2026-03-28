import type { ResumeDocument, WorkspaceIndex } from '@/domain/types'
import { migrateResumeDocument } from '@/domain/resume'
import { STORAGE_KEYS } from '@/persistence/storageKeys'

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  return JSON.parse(raw) as T
}

function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadWorkspaceIndex(): WorkspaceIndex | null {
  const parsed = readJson<WorkspaceIndex>(STORAGE_KEYS.workspace)
  if (!parsed) {
    return null
  }

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    currentResumeId: parsed.currentResumeId ?? '',
    resumeIds: Array.isArray(parsed.resumeIds) ? parsed.resumeIds : [],
    lastOpenedAt: parsed.lastOpenedAt ?? new Date().toISOString(),
  }
}

export function saveWorkspaceIndex(index: WorkspaceIndex): void {
  writeJson(STORAGE_KEYS.workspace, index)
}

export function loadResume(id: string): ResumeDocument | null {
  const parsed = readJson<ResumeDocument>(STORAGE_KEYS.resume(id))
  return parsed ? migrateResumeDocument(parsed) : null
}

export function saveResume(resume: ResumeDocument): void {
  writeJson(STORAGE_KEYS.resume(resume.id), resume)
}

export function deleteResume(id: string): void {
  window.localStorage.removeItem(STORAGE_KEYS.resume(id))
}

export function clearWorkspaceStorage(): void {
  const workspace = loadWorkspaceIndex()
  workspace?.resumeIds.forEach((id) => {
    deleteResume(id)
  })
  window.localStorage.removeItem(STORAGE_KEYS.workspace)
  window.localStorage.removeItem(STORAGE_KEYS.settings)
}
