import { describe, expect, it } from 'vitest'
import { createEmptyResume } from '@/domain/resume'
import { exportResumeToJson, importResumeFromJson } from '@/persistence/jsonExchange'

describe('json exchange', () => {
  it('exports and imports resume payload without losing title', async () => {
    const resume = createEmptyResume('前端简历')
    resume.basics.name = '张三'

    const payload = await exportResumeToJson(resume)
    const imported = importResumeFromJson(payload, ['前端简历'])

    expect(payload.resume.basics.name).toBe('张三')
    expect(imported.resume.title).toBe('前端简历 (2)')
    expect(imported.resume.basics.name).toBe('张三')
  })
})
