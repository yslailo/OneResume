import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResumeDocument from '@/components/ResumeDocument.vue'
import { createEmptyResume } from '@/domain/resume'

describe('ResumeDocument', () => {
  it('在基础信息居中模式下会让默认模板头部内容居中', () => {
    const resume = createEmptyResume('测试简历')
    resume.basics.name = '张三'
    resume.basics.title = '前端工程师'
    resume.basics.email = 'zhangsan@example.com'
    resume.basics.phone = '13800000000'
    resume.basics.summaryHtml = '<p>个人简介内容</p>'
    resume.style.centerSubtitle = true

    const wrapper = mount(ResumeDocument, {
      props: {
        resume,
        photoUrl: null,
      },
    })

    expect(wrapper.find('.resume-layout--default').exists()).toBe(true)
    expect(wrapper.find('.resume-header .text-4xl')?.element.parentElement?.className).toContain('text-center')
    expect(wrapper.find('.resume-header .flex.flex-wrap.gap-x-4')?.classes()).toContain('justify-center')
    expect(wrapper.find('.resume-header .resume-richtext')?.classes()).toContain('text-center')
  })

  it('会为 ATS 模板挂载独立布局和主题类名', () => {
    const resume = createEmptyResume('测试简历')
    resume.templateId = 'ats'

    const wrapper = mount(ResumeDocument, {
      props: {
        resume,
        photoUrl: null,
      },
    })

    expect(wrapper.find('.resume-sheet').classes()).toContain('resume-sheet--ats')
    expect(wrapper.find('.resume-layout--ats').exists()).toBe(true)
  })

  it('会为紧凑模板渲染双栏布局结构', () => {
    const resume = createEmptyResume('测试简历')
    resume.templateId = 'compact'

    const wrapper = mount(ResumeDocument, {
      props: {
        resume,
        photoUrl: null,
      },
    })

    expect(wrapper.find('.resume-layout--compact').exists()).toBe(true)
    expect(wrapper.find('.resume-compact-grid').exists()).toBe(true)
  })

  it('会为高管模板渲染强化头部和侧边信息区', () => {
    const resume = createEmptyResume('测试简历')
    resume.templateId = 'executive'
    resume.basics.email = 'ceo@example.com'

    const wrapper = mount(ResumeDocument, {
      props: {
        resume,
        photoUrl: null,
      },
    })

    expect(wrapper.find('.resume-layout--executive').exists()).toBe(true)
    expect(wrapper.find('.resume-executive-meta-card').exists()).toBe(true)
  })
})
