import type { ResumeSection } from '@/domain/types'

export type WorkbenchSelection = 'basics' | `section:${string}`

export function createSectionSelection(sectionId: string): WorkbenchSelection {
  return `section:${sectionId}`
}

export function getSectionIdFromSelection(selection: WorkbenchSelection): string | null {
  return selection.startsWith('section:') ? selection.slice('section:'.length) : null
}

export function ensureWorkbenchSelection(
  selection: WorkbenchSelection | null | undefined,
  sections: ResumeSection[],
): WorkbenchSelection {
  if (!selection || selection === 'basics') {
    return 'basics'
  }

  const sectionId = getSectionIdFromSelection(selection)
  if (!sectionId) {
    return 'basics'
  }

  return sections.some((section) => section.id === sectionId) ? selection : 'basics'
}

export function getWorkbenchSelections(sections: ResumeSection[]): WorkbenchSelection[] {
  return ['basics', ...sections.map((section) => createSectionSelection(section.id))]
}

export function getAdjacentWorkbenchSelection(
  selection: WorkbenchSelection,
  sections: ResumeSection[],
  offset: -1 | 1,
): WorkbenchSelection {
  const selections = getWorkbenchSelections(sections)
  const currentIndex = selections.indexOf(ensureWorkbenchSelection(selection, sections))
  const nextIndex = Math.max(0, Math.min(selections.length - 1, currentIndex + offset))
  return selections[nextIndex]
}
