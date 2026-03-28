import { describe, expect, it } from 'vitest'
import { createEmptyResume } from '@/domain/resume'
import { exportResumeToMarkdown, importResumeFromMarkdown } from '@/persistence/markdownExchange'

describe('markdown exchange', () => {
  it('exports visible sections in current order and includes photo markdown', () => {
    const resume = createEmptyResume('测试简历')
    resume.basics.name = '李四'
    resume.basics.summary = '熟悉 **Java** 与 Redis'
    resume.sectionOrder = [resume.sections[2].id, resume.sections[1].id, resume.sections[0].id, resume.sections[3].id, resume.sections[4].id]
    resume.sections[2].label = '项目经历'
    resume.sections[2].items.push({
      id: 'item-1',
      title: 'SaaSURL',
      subtitle: '核心开发',
      startDate: '',
      endDate: '',
      location: '',
      descriptionMarkdown: '- 支持短链接跳转',
      highlights: [],
    })
    resume.sections[1].items.push({
      id: 'item-2',
      title: '千匠网络',
      subtitle: '后端开发实习生',
      startDate: '2025.01',
      endDate: '至今',
      location: '上海',
      descriptionMarkdown: '- 负责接口开发',
      highlights: [],
    })

    const markdown = exportResumeToMarkdown(resume, {
      photoDataUrl: 'data:image/png;base64,avatar',
    })

    expect(markdown).toContain('# 李四')
    expect(markdown).toContain('<img src="data:image/png;base64,avatar" alt="头像" />')
    expect(markdown).toContain('## 个人简介')
    expect(markdown.indexOf('## 项目经历')).toBeLessThan(markdown.indexOf('## 工作经历'))
  })

  it('exports synced html as markdown with image and strong text', () => {
    const resume = createEmptyResume('测试')
    const markdown = exportResumeToMarkdown(resume, {
      preferredHtml: `
        <h1>袁帅</h1>
        <img src="data:image/png;base64,photo" alt="头像" />
        <p><strong>求职意向：</strong>后端开发实习生</p>
        <h2>项目经历</h2>
        <p><strong>SaaSURL</strong> 短链接系统</p>
        <ul><li>支持高并发跳转</li></ul>
      `,
    })

    expect(markdown).toContain('# 袁帅')
    expect(markdown).toContain('<img src="data:image/png;base64,photo" alt="头像" />')
    expect(markdown).toContain('**求职意向：**后端开发实习生')
    expect(markdown).toContain('- 支持高并发跳转')
  })

  it('imports markdown sections and falls back to custom sections', () => {
    const markdown = `
# 个人信息
姓名: 王五
职位: 全栈工程师

# 工作经历
## 云杉科技
高级前端工程师 | 上海 | 2024.01 - 至今
- 负责简历生成器开发

# 奇思妙想
这里是一段未识别内容
`

    const resume = importResumeFromMarkdown(markdown.trim(), [])
    const workSection = resume.sections.find((section) => section.label === '工作经历')
    const customSection = resume.sections.find((section) => section.label === '奇思妙想')

    expect(resume.basics.name).toBe('王五')
    expect(workSection?.items[0]?.title).toBe('云杉科技')
    expect(customSection?.type).toBe('custom')
  })

  it('imports html-based resume markdown', () => {
    const markdown = `
<div>
  <h1>袁帅</h1>
  <p>男 | 20岁 | 湖北 · 黄石</p>
  <p>18086169268 | yuanshuai1480@gmail.com</p>
  <p><strong>求职意向：后端开发实习生</strong></p>

  <h2>教育背景</h2>
  <div>
    <span>荆楚理工学院 · 计算机科学与技术 · 本科 · GPA: 3.6</span>
    <span>2023-09 - 2027-06</span>
  </div>
  <p><strong>在校主修课程：</strong>JAVA程序设计、计算机网络、数据结构</p>

  <h2>实习经历</h2>
  <div>
    <span>上海千匠网络科技有限公司</span>
    <span>2025-12 - 至今</span>
  </div>
  <p>后端开发实习生</p>
  <ul>
    <li>基于 BFF + Service Bus 架构重构短信发送链路</li>
  </ul>

  <h2>专业技能</h2>
  <ul>
    <li>熟练掌握 Java 基础</li>
    <li>熟悉 Redis 使用</li>
  </ul>
</div>
`

    const resume = importResumeFromMarkdown(markdown.trim(), [])
    const educationSection = resume.sections.find((section) => section.label === '教育背景')
    const workSection = resume.sections.find((section) => section.label === '实习经历')
    const skillsSection = resume.sections.find((section) => section.label === '专业技能')

    expect(resume.basics.name).toBe('袁帅')
    expect(resume.basics.title).toBe('后端开发实习生')
    expect(resume.basics.phone).toBe('18086169268')
    expect(resume.basics.email).toBe('yuanshuai1480@gmail.com')
    expect(resume.sourceFormat).toBe('html')
    expect(educationSection?.items[0]?.title).toContain('荆楚理工学院')
    expect(workSection?.type).toBe('work')
    expect(skillsSection?.items).toHaveLength(2)
  })
})
