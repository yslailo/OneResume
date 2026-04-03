import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

describe('router', () => {
  it('routes the landing page and workspace to separate entry points', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('home')

    await router.push('/workspace')
    expect(router.currentRoute.value.name).toBe('workspace')
  })

  it('keeps the print route intact', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    expect(router.resolve('/print/demo-id').name).toBe('print')
  })
})
