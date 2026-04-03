import { RouterLinkStub, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LandingView from '@/views/LandingView.vue'

describe('LandingView', () => {
  it('renders the core positioning and primary CTA', () => {
    const wrapper = mount(LandingView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

    expect(wrapper.text()).toContain('本地优先')
    expect(wrapper.text()).toContain('免登录')
    expect(wrapper.text()).toContain('立即开始制作')
    expect(wrapper.text()).toContain('支持导入 PDF / HTML / Markdown / JSON')

    const primaryCta = wrapper.findComponent(RouterLinkStub)
    expect(primaryCta.exists()).toBe(true)
    expect(primaryCta.props('to')).toBe('/workspace')
  })
})
