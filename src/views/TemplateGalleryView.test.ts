import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import TemplateGalleryView from '@/views/TemplateGalleryView.vue'

async function mountTemplateGallery(path = '/templates?from=workspace&current=minimal&resumeId=resume-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/templates', name: 'templates', component: TemplateGalleryView },
      { path: '/workspace', name: 'workspace', component: { template: '<div />' } },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(TemplateGalleryView, {
    global: {
      plugins: [router],
      stubs: {
        ResumeDocument: {
          template: '<div class="resume-document-stub"></div>',
        },
      },
    },
  })

  return { wrapper, router }
}

describe('TemplateGalleryView', () => {
  it('renders template cards and links back to workspace with template query', async () => {
    const { wrapper } = await mountTemplateGallery()

    expect(wrapper.text()).toContain('选择模板')
    expect(wrapper.findAll('.template-gallery-card')).toHaveLength(10)

    const firstCard = wrapper.findAll('.template-gallery-card')[0]
    expect(firstCard.attributes('href')).toContain('/workspace?template=minimal&resumeId=resume-1')
    expect(firstCard.classes()).toContain('template-gallery-card--active')
  })

  it('shows a back link to workspace when opened from the editor', async () => {
    const { wrapper } = await mountTemplateGallery()

    const backLink = wrapper.find('.template-gallery-header a')
    expect(backLink.exists()).toBe(true)
    expect(backLink.attributes('href')).toContain('/workspace?resumeId=resume-1')
  })
})
