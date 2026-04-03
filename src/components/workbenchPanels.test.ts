import { describe, expect, it } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'

import ResumeWorkbenchCanvas from '@/components/ResumeWorkbenchCanvas.vue'
import ResumeWorkbenchSidebar from '@/components/ResumeWorkbenchSidebar.vue'
import { createEmptyResume } from '@/domain/resume'

describe('workbench panels', () => {
  it('keeps sidebar renderable when stored style values are strings', () => {
    const resume = createEmptyResume('测试简历')
    resume.style = {
      ...resume.style,
      baseFontSize: '16' as never,
      sectionTitleSize: '20' as never,
      itemTitleSize: '18' as never,
      lineHeight: '1.8' as never,
      pageMargin: '18' as never,
      sectionGap: '14' as never,
      paragraphGap: '6' as never,
    }

    const wrapper = mount(ResumeWorkbenchSidebar, {
      props: {
        resume,
        sections: resume.sections,
        selection: 'basics',
        collapsed: false,
      },
    })

    expect(wrapper.text()).toContain('布局')
    expect(wrapper.text()).toContain('1.8')
    expect(wrapper.text()).toContain('模式')
  })

  it('emits stable style patches when clicking mode toggles', async () => {
    const resume = createEmptyResume('测试简历')

    const wrapper = mount(ResumeWorkbenchSidebar, {
      props: {
        resume,
        sections: resume.sections,
        selection: 'basics',
        collapsed: false,
      },
    })

    const modeButtons = wrapper.findAll('.layout-mode-option')
    expect(modeButtons).toHaveLength(3)

    await modeButtons[0].trigger('click')
    await modeButtons[1].trigger('click')
    await modeButtons[2].trigger('click')

    const updates = wrapper.emitted('update-style') ?? []
    expect(updates[0]?.[0]).toEqual({ showSectionIcons: true })
    expect(updates[1]?.[0]).toEqual({ centerSubtitle: true })
    expect(updates[2]?.[0]).toEqual({ stackItemMeta: true })
    expect(wrapper.text()).toContain('模式')
  })

  it('keeps the sidebar focused on layout controls instead of inline template gallery', () => {
    const resume = createEmptyResume('测试简历')

    const wrapper = mount(ResumeWorkbenchSidebar, {
      props: {
        resume,
        sections: resume.sections,
        selection: 'basics',
        collapsed: false,
      },
    })

    expect(wrapper.find('.template-picker-card').exists()).toBe(false)
  })

  it('shows all sections in collapsed sidebar mode', () => {
    const resume = createEmptyResume('测试简历')

    const wrapper = mount(ResumeWorkbenchSidebar, {
      props: {
        resume,
        sections: resume.sections,
        selection: 'basics',
        collapsed: true,
      },
    })

    const iconButtons = wrapper.findAll('button[aria-label]')
    const labels = iconButtons.map((button) => button.attributes('aria-label'))

    expect(labels).toContain('教育背景')
    expect(labels).toContain('工作经历')
    expect(labels).toContain('项目经历')
    expect(labels).toContain('专业技能')
    expect(labels).toContain('附加信息')
  })

  it('shows a fallback card when the current selection no longer exists', () => {
    const resume = createEmptyResume('测试简历')

    const wrapper = shallowMount(ResumeWorkbenchCanvas, {
      props: {
        resume,
        orderedSections: resume.sections,
        selection: 'section:missing',
        photoUrl: null,
      },
    })

    expect(wrapper.text()).toContain('当前模块暂时不可用')
    expect(wrapper.text()).toContain('返回基础信息')
  })
})
