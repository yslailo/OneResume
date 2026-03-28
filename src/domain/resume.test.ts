import { describe, expect, it } from 'vitest'
import {
  createEmptyResume,
  createImportedResume,
  createUniqueTitle,
  migrateResumeDocument,
  moveSectionOrder,
} from '@/domain/resume'

describe('resume domain', () => {
  it('creates a resume with default sections and order', () => {
    const resume = createEmptyResume('测试简历')

    expect(resume.title).toBe('测试简历')
    expect(resume.sections).toHaveLength(5)
    expect(resume.sectionOrder).toHaveLength(5)
    expect(resume.sections[0]?.type).toBe('education')
    expect(resume.style.photoPlacement).toBe('right')
  })

  it('migrates incomplete documents into stable schema', () => {
    const migrated = migrateResumeDocument({
      title: '导入简历',
      sections: [{ id: 'section-work', type: 'work', label: '工作经历', visible: true, items: [{} as never] }],
    })

    expect(migrated.version).toBe(1)
    expect(migrated.sections[0]?.items[0]?.id).toBeTruthy()
    expect(migrated.sectionOrder[0]).toBe(migrated.sections[0]?.id)
  })

  it('creates unique titles for imported resumes', () => {
    expect(createUniqueTitle('产品经理', ['产品经理', '产品经理 (2)'])).toBe('产品经理 (3)')

    const imported = createImportedResume({ title: '产品经理' }, ['产品经理'])
    expect(imported.title).toBe('产品经理 (2)')
    expect(imported.id).not.toBe('')
  })

  it('migrates photo placement and keeps custom sections editable', () => {
    const baseResume = createEmptyResume('模板')
    const migrated = migrateResumeDocument({
      style: { ...baseResume.style, photoPlacement: 'left' },
      sections: [
        {
          id: 'custom-1',
          type: 'custom',
          label: '自定义栏目',
          visible: true,
          items: [{ descriptionMarkdown: '自定义内容' } as never],
        },
      ],
    })

    expect(migrated.style.photoPlacement).toBe('left')
    expect(migrated.sections[0]?.type).toBe('custom')
    expect(migrated.sections[0]?.items[0]?.descriptionMarkdown).toBe('自定义内容')
  })

  it('moves section order to target position', () => {
    const next = moveSectionOrder(['a', 'b', 'c', 'd'], 'c', 1)

    expect(next).toEqual(['a', 'c', 'b', 'd'])
  })
})
