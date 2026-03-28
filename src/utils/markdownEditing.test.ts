import { describe, expect, it } from 'vitest'

import { wrapSelectionWithMarker } from '@/utils/markdownEditing'

describe('wrapSelectionWithMarker', () => {
  it('wraps selected text with markdown marker', () => {
    const result = wrapSelectionWithMarker('熟悉 Java 与 Redis', 3, 7, '**')

    expect(result.value).toBe('熟悉 **Java** 与 Redis')
    expect(result.selectionStart).toBe(5)
    expect(result.selectionEnd).toBe(9)
  })

  it('inserts empty marker pair when nothing is selected', () => {
    const result = wrapSelectionWithMarker('后端开发', 2, 2, '**')

    expect(result.value).toBe('后端****开发')
    expect(result.selectionStart).toBe(4)
    expect(result.selectionEnd).toBe(4)
  })
})
