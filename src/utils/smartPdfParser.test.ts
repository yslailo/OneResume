import { describe, expect, it } from 'vitest'

import { buildStructuredHtmlFromPdfItems } from '@/utils/smartPdfParser'

describe('smartPdfParser', () => {
  it('builds html blocks from positioned pdf text items', () => {
    const html = buildStructuredHtmlFromPdfItems([
      { str: '袁帅', x: 40, y: 780, fontSize: 20, fontName: 'Bold', width: 60, page: 1 },
      { str: '18086169268', x: 40, y: 760, fontSize: 11, fontName: 'Regular', width: 70, page: 1 },
      { str: 'yuanshuai1480@gmail.com', x: 130, y: 760, fontSize: 11, fontName: 'Regular', width: 150, page: 1 },
      { str: '教育背景', x: 40, y: 720, fontSize: 14, fontName: 'Bold', width: 64, page: 1 },
      { str: '荆楚理工学院', x: 40, y: 700, fontSize: 11, fontName: 'Bold', width: 90, page: 1 },
      { str: '2023-09 - 2027-06', x: 340, y: 700, fontSize: 11, fontName: 'Regular', width: 120, page: 1 },
      { str: '专业技能', x: 40, y: 660, fontSize: 14, fontName: 'Bold', width: 64, page: 1 },
      { str: '• 熟悉 Java 基础', x: 40, y: 640, fontSize: 11, fontName: 'Regular', width: 120, page: 1 },
      { str: '• 熟悉 Redis 使用', x: 40, y: 620, fontSize: 11, fontName: 'Regular', width: 130, page: 1 },
    ])

    expect(html).toContain('<h1>袁帅</h1>')
    expect(html).toContain('<h2>教育背景</h2>')
    expect(html).toContain('<div><span>荆楚理工学院</span><span>2023-09 - 2027-06</span></div>')
    expect(html).toContain('<h2>专业技能</h2>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>熟悉 Java 基础</li>')
  })
})
