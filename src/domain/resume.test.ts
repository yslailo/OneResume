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
    expect(resume.style.sectionTitleSize).toBe(18)
    expect(resume.style.paragraphGap).toBe(8)
  })

  it('migrates incomplete documents into stable schema', () => {
    const migrated = migrateResumeDocument({
      title: '导入简历',
      sections: [{ id: 'section-work', type: 'work', label: '工作经历', visible: true, items: [{} as never] }],
    })

    expect(migrated.version).toBe(3)
    expect(migrated.sections[0]?.items[0]?.id).toBeTruthy()
    expect(migrated.sectionOrder[0]).toBe(migrated.sections[0]?.id)
  })

  it('migrates legacy markdown fields into html fields', () => {
    const migrated = migrateResumeDocument({
      basics: { summary: '熟悉 **Vue** 与 *TypeScript*' } as never,
      sections: [
        {
          id: 'custom-1',
          type: 'custom',
          label: '自定义栏目',
          visible: true,
          items: [{ descriptionMarkdown: '- 自定义内容' } as never],
        },
      ],
    })

    expect(migrated.basics.summaryHtml).toContain('<strong>Vue</strong>')
    expect(migrated.sections[0]?.items[0]?.descriptionHtml).toContain('<ul>')
  })

  it('keeps newly added template ids during migration', () => {
    const templateIds = [
      'classic-blue',
      'professional',
      'clean',
      'compact',
      'elegant',
      'executive',
      'ats',
      'classic-sidebar',
      'minimal',
      'modern',
    ] as const

    for (const templateId of templateIds) {
      const migrated = migrateResumeDocument({
        title: '模板测试',
        templateId,
      })

      expect(migrated.templateId).toBe(templateId)
    }
  })

  it('migrates legacy font family values into new options', () => {
    const serifMigrated = migrateResumeDocument({
      style: { fontFamily: 'serif' as never } as never,
    })
    const sansMigrated = migrateResumeDocument({
      style: { fontFamily: 'sans' as never } as never,
    })

    expect(serifMigrated.style.fontFamily).toBe('source-serif')
    expect(sansMigrated.style.fontFamily).toBe('alibaba')
  })

  it('normalizes legacy string style values into safe numbers', () => {
    const migrated = migrateResumeDocument({
      style: {
        baseFontSize: '16' as never,
        sectionTitleSize: '20' as never,
        itemTitleSize: '18' as never,
        lineHeight: '1.8' as never,
        pageMargin: '22' as never,
        sectionGap: '14' as never,
        paragraphGap: '6' as never,
      } as never,
    })

    expect(migrated.style.baseFontSize).toBe(16)
    expect(migrated.style.sectionTitleSize).toBe(20)
    expect(migrated.style.itemTitleSize).toBe(18)
    expect(migrated.style.lineHeight).toBe(1.8)
    expect(migrated.style.pageMargin).toBe(22)
    expect(migrated.style.sectionGap).toBe(14)
    expect(migrated.style.paragraphGap).toBe(6)
  })

  it('creates unique titles for imported resumes', () => {
    expect(createUniqueTitle('产品经理', ['产品经理', '产品经理 (2)'])).toBe('产品经理 (3)')

    const imported = createImportedResume({ title: '产品经理' }, ['产品经理'])
    expect(imported.title).toBe('产品经理 (2)')
    expect(imported.id).not.toBe('')
  })

  it('moves section order to target position', () => {
    const next = moveSectionOrder(['a', 'b', 'c', 'd'], 'c', 1)

    expect(next).toEqual(['a', 'c', 'b', 'd'])
  })
})
