import { describe, expect, it } from 'vitest'

import { convertPdfTextToMarkdown, importResumeFromPdfText } from '@/persistence/pdfExchange'

describe('pdf exchange', () => {
  it('converts extracted pdf text into importable markdown', () => {
    const markdown = convertPdfTextToMarkdown(`
袁帅
求职意向：后端开发实习生
18086169268
yuanshuai1480@gmail.com
湖北 黄石

教育背景
荆楚理工学院 计算机科学与技术 本科
2023-09 - 2027-06

实习经历
上海千匠网络科技有限公司
后端开发实习生
- 负责短信发送链路改造

专业技能
- 熟悉 Java 基础
- 熟悉 Redis 使用
`)

    expect(markdown).toContain('# 个人信息')
    expect(markdown).toContain('姓名: 袁帅')
    expect(markdown).toContain('职位: 后端开发实习生')
    expect(markdown).toContain('电话: 18086169268')
    expect(markdown).toContain('邮箱: yuanshuai1480@gmail.com')
    expect(markdown).toContain('# 教育背景')
    expect(markdown).toContain('# 实习经历')
    expect(markdown).toContain('# 专业技能')
  })

  it('imports extracted pdf text into editable resume data', () => {
    const resume = importResumeFromPdfText(
      `
袁帅
求职意向：后端开发实习生
18086169268
yuanshuai1480@gmail.com
湖北 黄石

教育背景
荆楚理工学院 计算机科学与技术 本科
2023-09 - 2027-06

项目经历
SaaSURL
核心开发
- 支持高并发跳转

专业技能
- 熟悉 Java 基础
- 熟悉 Redis 使用
`,
      [],
    )

    const educationSection = resume.sections.find((section) => section.label === '教育背景')
    const projectSection = resume.sections.find((section) => section.label === '项目经历')
    const skillsSection = resume.sections.find((section) => section.label === '专业技能')

    expect(resume.basics.name).toBe('袁帅')
    expect(resume.basics.title).toBe('后端开发实习生')
    expect(resume.basics.phone).toBe('18086169268')
    expect(resume.basics.email).toBe('yuanshuai1480@gmail.com')
    expect(educationSection?.type).toBe('education')
    expect(projectSection?.type).toBe('project')
    expect(skillsSection?.type).toBe('skills')
  })
})
