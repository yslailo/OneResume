import { createEmptyItem } from '@/domain/resume'
import type { ResumeItem } from '@/domain/types'

export function getSkillItemContent(item: ResumeItem): string {
  if (item.descriptionHtml) {
    return item.descriptionHtml
  }

  return item.title.trim() ? `<p>${item.title.trim()}</p>` : ''
}

export function normalizeSkillItems(items: ResumeItem[]): ResumeItem[] {
  const baseItem = items[0] ?? createEmptyItem()
  const mergedContent = items
    .map((item) => getSkillItemContent(item).trim())
    .filter(Boolean)
    .join('')

  return [
    {
      ...baseItem,
      title: '',
      subtitle: '',
      startDate: '',
      endDate: '',
      location: '',
      descriptionHtml: mergedContent,
      highlights: [],
    },
  ]
}
