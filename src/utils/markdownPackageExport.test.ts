import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import { buildMarkdownPackageBlob } from '@/utils/markdownPackageExport'

describe('markdown package export', () => {
  it('builds a zip with README, avatar image and extra html file', async () => {
    const blob = await buildMarkdownPackageBlob({
      markdown: '# 测试简历\n\n![头像](images/avatar.png)',
      images: [
        {
          name: 'avatar.png',
          blob: new Blob(['avatar'], { type: 'image/png' }),
        },
      ],
      extraFiles: [
        {
          name: 'resume.html',
          content: '<html><body><h1>测试简历</h1></body></html>',
        },
      ],
    })

    const zip = await JSZip.loadAsync(blob)
    const fileNames = Object.keys(zip.files)

    expect(fileNames).toContain('README.md')
    expect(fileNames).toContain('images/')
    expect(fileNames).toContain('images/avatar.png')
    expect(fileNames).toContain('resume.html')
    await expect(zip.file('README.md')?.async('string')).resolves.toContain('![头像](images/avatar.png)')
    await expect(zip.file('resume.html')?.async('string')).resolves.toContain('<h1>测试简历</h1>')
  })

  it('still creates images directory without image files', async () => {
    const blob = await buildMarkdownPackageBlob({
      markdown: '# 空简历',
      images: [],
    })

    const zip = await JSZip.loadAsync(blob)
    const fileNames = Object.keys(zip.files)

    expect(fileNames).toContain('README.md')
    expect(fileNames).toContain('images/')
  })
})
