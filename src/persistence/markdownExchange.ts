import { sortSectionsByOrder } from '@/domain/resume'
import type { ResumeDocument } from '@/domain/types'
import { richTextHtmlToMarkdown } from '@/utils/richTextContent'
import { parseHtmlToResume, parseMarkdownToResume } from '@/persistence/importParsers'

interface MarkdownExportOptions {
  photoMarkdownPath?: string
  preferredHtml?: string | null
}

interface HtmlImportOptions {
  preserveSourceHtml?: boolean
}

function looksLikeHtmlDocument(content: string): boolean {
  return /<h1[\s>]|<h2[\s>]|<div[\s>]|<p[\s>]|<ul[\s>]|<img[\s>]|<table[\s>]/i.test(content)
}

function renderAvatarMarkdown(photoMarkdownPath?: string): string | null {
  return photoMarkdownPath ? `![头像](${photoMarkdownPath})` : null
}

export function importResumeFromHtmlContent(
  html: string,
  existingTitles: string[],
  options: HtmlImportOptions = {},
): ResumeDocument {
  return parseHtmlToResume(html, existingTitles, {
    preserveSourceHtml: options.preserveSourceHtml ?? true,
  })
}

function exportStructuredResumeToMarkdown(resume: ResumeDocument, photoMarkdownPath?: string): string {
  const sections = sortSectionsByOrder(resume).filter((section) => section.visible && section.items.length > 0)
  const title = resume.basics.name || resume.title || '未命名简历'
  const blocks: string[] = [`# ${title}`]

  const avatarMarkdown = resume.style.showPhoto ? renderAvatarMarkdown(photoMarkdownPath) : null
  if (avatarMarkdown) {
    blocks.push(avatarMarkdown)
  }

  const metaLines = [
    resume.basics.title ? `职位：${resume.basics.title}` : '',
    resume.basics.email ? `邮箱：${resume.basics.email}` : '',
    resume.basics.phone ? `电话：${resume.basics.phone}` : '',
    resume.basics.location ? `地点：${resume.basics.location}` : '',
    resume.basics.website ? `网站：${resume.basics.website}` : '',
    resume.basics.github ? `GitHub：${resume.basics.github}` : '',
  ].filter(Boolean)

  if (metaLines.length > 0) {
    blocks.push(metaLines.join('\n'))
  }

  const summaryMarkdown = richTextHtmlToMarkdown(resume.basics.summaryHtml)
  if (summaryMarkdown.trim()) {
    blocks.push('## 个人简介')
    blocks.push(summaryMarkdown.trim())
  }

  sections.forEach((section) => {
    blocks.push(`## ${section.label}`)

    section.items.forEach((item) => {
      if (section.type === 'skills') {
        const skillText = richTextHtmlToMarkdown(item.descriptionHtml || (item.title ? `<p>${item.title}</p>` : ''))
        if (!skillText.trim()) {
          return
        }

        blocks.push(skillText.trim())
        return
      }

      if (item.title.trim()) {
        blocks.push(`### ${item.title.trim()}`)
      }

      const meta = [item.subtitle, item.location, [item.startDate, item.endDate].filter(Boolean).join(' - ')]
        .filter(Boolean)
        .join(' | ')
      if (meta) {
        blocks.push(meta)
      }

      const descriptionMarkdown = richTextHtmlToMarkdown(item.descriptionHtml)
      if (descriptionMarkdown.trim()) {
        blocks.push(descriptionMarkdown.trim())
      }

      if (item.highlights.length > 0) {
        blocks.push(...item.highlights.map((highlight) => `- ${highlight}`))
      }
    })
  })

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function exportResumeToMarkdown(resume: ResumeDocument, options: MarkdownExportOptions = {}): string {
  if (options.preferredHtml) {
    const blocks = [
      resume.style.showPhoto ? renderAvatarMarkdown(options.photoMarkdownPath) : null,
      richTextHtmlToMarkdown(options.preferredHtml),
    ].filter(Boolean)

    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  return exportStructuredResumeToMarkdown(resume, options.photoMarkdownPath)
}

export function importResumeFromMarkdown(markdown: string, existingTitles: string[]): ResumeDocument {
  if (looksLikeHtmlDocument(markdown)) {
    // 从 Markdown 入口导入的 HTML 内容，只提取数据，不保留原 HTML 模板模式
    return importResumeFromHtmlContent(markdown, existingTitles, { preserveSourceHtml: false })
  }

  return parseMarkdownToResume(markdown, existingTitles)
}
