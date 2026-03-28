import { describe, expect, it } from 'vitest'
import { createEmptyItem, createEmptyResume } from '@/domain/resume'
import { renderResumeIntoHtmlTemplate } from '@/persistence/htmlTemplateSync'

describe('html template sync', () => {
  it('renders structured resume data back into imported html template', () => {
    const template = `
<div>
  <div>
    <div>
      <h1>原姓名</h1>
      <p>男 | 20岁 | 原地点</p>
      <p>11111111111 | old@example.com</p>
      <p><strong>求职意向：原职位</strong></p>
    </div>
    <img src="old.jpg" />
  </div>
  <h2>教育背景</h2>
  <div><span>原学校</span><span>2020-01 - 2024-01</span></div>
  <p>原教育描述</p>
  <h2>项目经历</h2>
  <div><span>原项目</span><span>原角色</span></div>
  <p>原项目介绍</p>
  <ul><li>原项目条目</li></ul>
  <h2>专业技能</h2>
  <ul><li>原技能</li></ul>
</div>
`.trim()

    const resume = createEmptyResume('测试')
    resume.sourceFormat = 'html'
    resume.rawSourceHtml = template
    resume.basics.name = '袁帅'
    resume.basics.location = '湖北黄石'
    resume.basics.phone = '18086169268'
    resume.basics.email = 'yuanshuai1480@gmail.com'
    resume.basics.title = '后端开发实习生'

    resume.sections = [
      {
        ...resume.sections[0],
        label: '教育背景',
        visible: true,
        items: [
          createEmptyItem({
            title: '荆楚理工学院',
            startDate: '2023-09',
            endDate: '2027-06',
            descriptionMarkdown: '在校主修课程：JAVA程序设计、计算机网络',
          }),
        ],
      },
      {
        ...resume.sections[2],
        label: '项目经历',
        visible: true,
        items: [
          createEmptyItem({
            title: 'SaaSURL',
            subtitle: '核心开发',
            descriptionMarkdown: '项目介绍：短链接系统\n\n- 使用 RocketMQ 削峰\n- 使用 Redis 保证一致性',
          }),
        ],
      },
      {
        ...resume.sections[3],
        label: '专业技能',
        visible: true,
        items: [
          createEmptyItem({ title: '熟悉 Java 基础' }),
          createEmptyItem({ title: '熟悉 Redis 使用' }),
        ],
      },
    ]
    resume.sectionOrder = resume.sections.map((section) => section.id)

    const html = renderResumeIntoHtmlTemplate(template, resume, 'blob:avatar')

    expect(html).toContain('袁帅')
    expect(html).toContain('18086169268 | yuanshuai1480@gmail.com')
    expect(html).toContain('求职意向：后端开发实习生')
    expect(html).toContain('荆楚理工学院')
    expect(html).toContain('SaaSURL')
    expect(html).toContain('熟悉 Redis 使用')
    expect(html).toContain('blob:avatar')
  })
})
