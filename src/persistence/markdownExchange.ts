import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Heading, ListItem, Root, RootContent } from 'mdast'

import {
  createDefaultSection,
  createEmptyItem,
  createImportedResume,
  normalizeSectionHeading,
  sortSectionsByOrder,
} from '@/domain/resume'
import type { ResumeDocument, ResumeSection, SectionType } from '@/domain/types'
import { markdownToRichTextHtml, plainTextToRichTextHtml, richTextHtmlToMarkdown } from '@/utils/richTextContent'

interface MarkdownExportOptions {
  photoMarkdownPath?: string
  preferredHtml?: string | null
}

interface HtmlImportOptions {
  preserveSourceHtml?: boolean
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim()
}

function looksLikeHtmlDocument(content: string): boolean {
  return /<h1[\s>]|<h2[\s>]|<div[\s>]|<p[\s>]|<ul[\s>]|<img[\s>]|<table[\s>]/i.test(content)
}

function renderAvatarMarkdown(photoMarkdownPath?: string): string | null {
  return photoMarkdownPath ? `![头像](${photoMarkdownPath})` : null
}

function collectSectionElements(start: Element): Element[] {
  const elements: Element[] = []
  let cursor = start.nextElementSibling

  while (cursor && cursor.tagName.toLowerCase() !== 'h2') {
    elements.push(cursor)
    cursor = cursor.nextElementSibling
  }

  return elements
}

function siblingText(node: Element | null): string {
  return cleanText(node?.textContent ?? '')
}

function extractPhone(value: string): string {
  const match = value.match(/1[3-9]\d{9}/)
  return match?.[0] ?? ''
}

function extractEmail(value: string): string {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ''
}

function extractLocation(value: string): string {
  const parts = value
    .split(/[|·•\\/]/)
    .map((part) => cleanText(part))
    .filter(Boolean)

  return parts.at(-1) ?? ''
}

function htmlBlockToRichText(element: Element): string {
  return element.outerHTML
}

function htmlElementsToRichText(elements: Element[]): string {
  return elements
    .map((element) => {
      if (['ul', 'ol', 'p', 'blockquote', 'h3', 'h4'].includes(element.tagName.toLowerCase())) {
        return htmlBlockToRichText(element)
      }

      const text = cleanText(element.textContent ?? '')
      return text ? `<p>${text}</p>` : ''
    })
    .filter(Boolean)
    .join('')
}

export function importResumeFromHtmlContent(
  html: string,
  existingTitles: string[],
  options: HtmlImportOptions = {},
): ResumeDocument {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const resume = createImportedResume({ title: 'HTML 导入简历' }, existingTitles)
  const preserveSourceHtml = options.preserveSourceHtml ?? true
  const nameHeading = document.querySelector('h1')
  const sectionHeadings = Array.from(document.querySelectorAll('h2'))
  const introParagraphs = Array.from(document.querySelectorAll('p'))
    .map((node) => cleanText(node.textContent ?? ''))
    .filter(Boolean)

  resume.basics.name = siblingText(nameHeading)
  resume.title = resume.basics.name ? `${resume.basics.name}的简历` : resume.title
  resume.sourceFormat = preserveSourceHtml ? 'html' : 'structured'
  resume.previewMode = preserveSourceHtml ? 'source-html' : 'structured'
  resume.rawSourceHtml = preserveSourceHtml ? html : null

  for (const line of introParagraphs.slice(0, 4)) {
    if (!resume.basics.location && (line.includes('·') || line.includes('|'))) {
      resume.basics.location = extractLocation(line)
    }
    if (!resume.basics.phone) {
      resume.basics.phone = extractPhone(line)
    }
    if (!resume.basics.email) {
      resume.basics.email = extractEmail(line)
    }

    const titleMatch = line.match(/求职意向[:：]\s*(.+)$/)
    if (titleMatch && !resume.basics.title) {
      resume.basics.title = cleanText(titleMatch[1] ?? '')
    }
  }

  const summaryParagraph = Array.from(document.querySelectorAll('p')).find((node) => cleanText(node.textContent ?? '').length > 20)
  if (summaryParagraph) {
    resume.basics.summaryHtml = summaryParagraph.outerHTML
  }

  const parsedSections: ResumeSection[] = []

  sectionHeadings.forEach((heading) => {
    const label = cleanText(heading.textContent ?? '')
    const type = normalizeSectionHeading(label) ?? 'custom'
    const elements = collectSectionElements(heading)
    const section = createDefaultSection(type, { label })

    if (type === 'education' || type === 'work' || type === 'project') {
      const headerDiv = elements.find((element) => element.tagName.toLowerCase() === 'div')
      const spans = headerDiv
        ? Array.from(headerDiv.querySelectorAll('span')).map((node) => cleanText(node.textContent ?? ''))
        : []
      const contentElements = elements.filter((element) => element !== headerDiv)

      section.items = [
        createEmptyItem({
          title: spans[0] ?? label,
          subtitle: type === 'work' ? cleanText(contentElements[0]?.textContent ?? '') : spans[1] ?? '',
          startDate: spans[1]?.split('-')[0]?.trim() ?? '',
          endDate: spans[1]?.split('-')[1]?.trim() ?? '',
          descriptionHtml: htmlElementsToRichText(type === 'work' ? contentElements.slice(1) : contentElements),
        }),
      ]
    } else if (type === 'skills') {
      const items = Array.from(
        (elements.find((element) => /^(ul|ol)$/i.test(element.tagName)) ?? document.createElement('ul')).querySelectorAll('li'),
      ).map((item) =>
        createEmptyItem({
          descriptionHtml: `<p>${cleanText(item.textContent ?? '')}</p>`,
        }),
      )

      section.items = items.length > 0 ? items : [createEmptyItem()]
    } else {
      section.items = [
        createEmptyItem({
          descriptionHtml: htmlElementsToRichText(elements),
        }),
      ]
    }

    section.items = section.items.filter((item) => item.title || item.subtitle || item.descriptionHtml)
    if (section.items.length > 0) {
      parsedSections.push(section)
    }
  })

  if (parsedSections.length > 0) {
    resume.sections = parsedSections
    resume.sectionOrder = parsedSections.map((section) => section.id)
  }

  return resume
}

function headingText(node: Heading): string {
  return toString(node).trim()
}

function nodesToMarkdown(nodes: RootContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'paragraph') {
        return toString(node).trim()
      }

      if (node.type === 'list') {
        const ordered = Boolean(node.ordered)
        return node.children.map((item, index) => `${ordered ? `${index + 1}.` : '-'} ${toString(item).trim()}`).join('\n')
      }

      if (node.type === 'blockquote') {
        return `> ${toString(node).trim()}`
      }

      if (node.type === 'code') {
        return `\`\`\`\n${node.value}\n\`\`\``
      }

      return toString(node).trim()
    })
    .filter(Boolean)
    .join('\n\n')
}

function splitSections(root: Root): Array<{ heading: string; nodes: RootContent[] }> {
  const groups: Array<{ heading: string; nodes: RootContent[] }> = []
  let current: { heading: string; nodes: RootContent[] } | null = null

  root.children.forEach((node) => {
    if (node.type === 'heading' && node.depth === 1) {
      current = { heading: headingText(node), nodes: [] }
      groups.push(current)
      return
    }

    if (!current) {
      current = { heading: '个人信息', nodes: [] }
      groups.push(current)
    }

    current.nodes.push(node)
  })

  return groups
}

function extractBasics(nodes: RootContent[], resume: ResumeDocument): void {
  const lines = nodesToMarkdown(nodes)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const summaryLines: string[] = []

  lines.forEach((line, index) => {
    if (index === 0 && !line.includes(':') && !line.includes('：')) {
      resume.basics.name = line
      return
    }

    const [rawKey, ...rest] = line.split(/[:：]/)
    const value = rest.join(':').trim()
    const key = rawKey.trim().toLowerCase()

    if (!value) {
      summaryLines.push(line.replace(/^- /, ''))
      return
    }

    if (['姓名', 'name'].includes(key)) resume.basics.name = value
    else if (['职位', 'title'].includes(key)) resume.basics.title = value
    else if (['邮箱', 'email'].includes(key)) resume.basics.email = value
    else if (['电话', '手机', 'phone'].includes(key)) resume.basics.phone = value
    else if (['地点', '城市', 'location'].includes(key)) resume.basics.location = value
    else if (['网站', 'website'].includes(key)) resume.basics.website = value
    else if (['github'].includes(key)) resume.basics.github = value
    else if (['简介', 'summary'].includes(key)) summaryLines.push(value)
  })

  resume.basics.summaryHtml = markdownToRichTextHtml(summaryLines.join('\n\n'))
}

function listItemToText(item: ListItem): string {
  return item.children.map((child) => toString(child)).join('\n').trim()
}

function extractItems(type: SectionType, nodes: RootContent[]): ResumeSection {
  const section = createDefaultSection(type)
  const items: ReturnType<typeof createEmptyItem>[] = []
  let currentItem = createEmptyItem()
  let bufferedNodes: RootContent[] = []

  const flush = () => {
    currentItem.descriptionHtml = markdownToRichTextHtml(nodesToMarkdown(bufferedNodes))
    if (currentItem.title || currentItem.subtitle || currentItem.descriptionHtml) {
      items.push(currentItem)
    }
    currentItem = createEmptyItem()
    bufferedNodes = []
  }

  nodes.forEach((node) => {
    if (node.type === 'heading' && node.depth === 2) {
      flush()
      currentItem.title = headingText(node)
      return
    }

    if (node.type === 'paragraph' && !currentItem.title) {
      const line = toString(node).trim()
      if (line.includes('|')) {
        const [title, subtitle, date] = line.split('|').map((entry) => entry.trim())
        currentItem.title = title
        currentItem.subtitle = subtitle ?? ''
        currentItem.startDate = date ?? ''
        return
      }
    }

    if (node.type === 'list' && type === 'skills') {
      node.children.forEach((listItem) => {
        items.push(
          createEmptyItem({
            descriptionHtml: markdownToRichTextHtml(`- ${listItemToText(listItem)}`),
          }),
        )
      })
      return
    }

    bufferedNodes.push(node)
  })

  flush()
  section.items = items.length > 0 ? items : [createEmptyItem({ descriptionHtml: markdownToRichTextHtml(nodesToMarkdown(nodes)) })]
  return section
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
    return importResumeFromHtmlContent(markdown, existingTitles)
  }

  const root = unified().use(remarkParse).parse(markdown) as Root
  const resume = createImportedResume({ title: 'Markdown 导入简历' }, existingTitles)
  const groups = splitSections(root)
  const parsedSections: ResumeSection[] = []

  groups.forEach((group) => {
    const normalizedType = normalizeSectionHeading(group.heading)

    if (group.heading === '个人信息' || group.heading.toLowerCase() === 'basics') {
      extractBasics(group.nodes, resume)
      return
    }

    if (normalizedType) {
      const section = extractItems(normalizedType, group.nodes)
      section.label = group.heading
      parsedSections.push(section)
      return
    }

    const fallback = extractItems('custom', group.nodes)
    fallback.label = group.heading || '待整理'
    parsedSections.push(fallback)
  })

  if (parsedSections.length > 0) {
    resume.sections = parsedSections
    resume.sectionOrder = parsedSections.map((section) => section.id)
  }

  if (!resume.basics.summaryHtml && resume.basics.name) {
    resume.basics.summaryHtml = plainTextToRichTextHtml('')
  }

  return resume
}
