import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

describe('router', () => {
  it('routes the landing page and workspace to separate entry points', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    expect(router.resolve('/').name).toBe('home')
    expect(router.resolve('/workspace').name).toBe('workspace')
    expect(router.resolve('/templates').name).toBe('templates')
  })

  it('keeps the print route intact', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    expect(router.resolve('/print/demo-id').name).toBe('print')
  })
})
