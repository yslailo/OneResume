import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Content, Heading, ListItem, Root, RootContent } from 'mdast'

import {
  createDefaultSection,
  createEmptyItem,
  createImportedResume,
  normalizeSectionHeading,
  sortSectionsByOrder,
} from '@/domain/resume'
import type { ResumeDocument, ResumeSection, SectionType } from '@/domain/types'

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

function looksLikeHtmlDocument(markdown: string): boolean {
  return /<h1[\s>]|<h2[\s>]|<div[\s>]|<p[\s>]|<ul[\s>]|<img[\s>]|<table[\s>]/i.test(markdown)
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

function htmlListToMarkdown(list: Element | null): string {
  if (!list) {
    return ''
  }

  return Array.from(list.querySelectorAll('li'))
    .map((item) => `- ${cleanText(item.textContent ?? '')}`)
    .join('\n')
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
    .split(/[|·•路\\/]/)
    .map((part) => cleanText(part))
    .filter(Boolean)

  return parts.at(-1) ?? ''
}

export function importResumeFromHtmlContent(
  markdown: string,
  existingTitles: string[],
  options: HtmlImportOptions = {},
): ResumeDocument {
  const parser = new DOMParser()
  const document = parser.parseFromString(markdown, 'text/html')
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
  resume.rawSourceHtml = preserveSourceHtml ? markdown : null

  for (const line of introParagraphs.slice(0, 4)) {
    if (!resume.basics.location && (line.includes('路') || line.includes('|') || line.includes('·'))) {
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

  const parsedSections: ResumeSection[] = []

  sectionHeadings.forEach((heading) => {
    const label = cleanText(heading.textContent ?? '')
    const type = normalizeSectionHeading(label) ?? 'custom'
    const elements = collectSectionElements(heading)
    const section = createDefaultSection(type, { label })

    if (type === 'education') {
      const headerDiv = elements.find((element) => element.tagName.toLowerCase() === 'div')
      const spans = headerDiv
        ? Array.from(headerDiv.querySelectorAll('span')).map((node) => cleanText(node.textContent ?? ''))
        : []
      const courseText = elements
        .filter((element) => element.tagName.toLowerCase() === 'p')
        .map((node) => cleanText(node.textContent ?? ''))
        .join('\n')

      section.items = [
        createEmptyItem({
          title: spans[0] ?? label,
          startDate: spans[1]?.split('-')[0]?.trim() ?? '',
          endDate: spans[1]?.split('-')[1]?.trim() ?? '',
          descriptionMarkdown: courseText ? `- ${courseText}` : '',
        }),
      ]
    } else if (type === 'work') {
      const headerDiv = elements.find((element) => element.tagName.toLowerCase() === 'div')
      const spans = headerDiv
        ? Array.from(headerDiv.querySelectorAll('span')).map((node) => cleanText(node.textContent ?? ''))
        : []
      const paragraphs = elements.filter((element) => element.tagName.toLowerCase() === 'p')
      const role = cleanText(paragraphs[0]?.textContent ?? '')
      const extraParagraphs = paragraphs.slice(1).map((node) => cleanText(node.textContent ?? ''))
      const listMarkdown = htmlListToMarkdown(elements.find((element) => element.tagName.toLowerCase() === 'ul') ?? null)
      const descriptionParts = [...extraParagraphs, listMarkdown].filter(Boolean)

      section.items = [
        createEmptyItem({
          title: spans[0] ?? label,
          subtitle: role,
          startDate: spans[1]?.split('-')[0]?.trim() ?? '',
          endDate: spans[1]?.split('-')[1]?.trim() ?? '',
          descriptionMarkdown: descriptionParts.join('\n\n'),
        }),
      ]
    } else if (type === 'project') {
      const items = []
      let index = 0

      while (index < elements.length) {
        const current = elements[index]
        if (current.tagName.toLowerCase() !== 'div') {
          index += 1
          continue
        }

        const spans = Array.from(current.querySelectorAll('span')).map((node) => cleanText(node.textContent ?? ''))
        if (spans.length === 0) {
          index += 1
          continue
        }

        const descriptionParts: string[] = []
        let lookahead = index + 1

        while (lookahead < elements.length && elements[lookahead].tagName.toLowerCase() !== 'div') {
          const element = elements[lookahead]
          if (element.tagName.toLowerCase() === 'p') {
            descriptionParts.push(cleanText(element.textContent ?? ''))
          } else if (element.tagName.toLowerCase() === 'ul') {
            descriptionParts.push(htmlListToMarkdown(element))
          }
          lookahead += 1
        }

        items.push(
          createEmptyItem({
            title: spans[0] ?? '项目经历',
            subtitle: spans[1] ?? '',
            descriptionMarkdown: descriptionParts.filter(Boolean).join('\n\n'),
          }),
        )

        index = lookahead
      }

      section.items =
        items.length > 0
          ? items
          : [
              createEmptyItem({
                descriptionMarkdown: elements.map((element) => cleanText(element.textContent ?? '')).join('\n'),
              }),
            ]
    } else if (type === 'skills') {
      section.items = Array.from(
        (elements.find((element) => /^(ul|ol)$/i.test(element.tagName)) ?? document.createElement('ul')).querySelectorAll('li'),
      ).map((item) =>
        createEmptyItem({
          descriptionMarkdown: cleanText(item.textContent ?? ''),
        }),
      )
    } else {
      section.items = [
        createEmptyItem({
          descriptionMarkdown: elements
            .map((element) =>
              element.tagName.toLowerCase() === 'ul'
                ? htmlListToMarkdown(element)
                : cleanText(element.textContent ?? ''),
            )
            .filter(Boolean)
            .join('\n\n'),
        }),
      ]
    }

    section.items = section.items.filter((item) => item.title || item.subtitle || item.descriptionMarkdown)
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
        return node.children.map((item) => `- ${toString(item).trim()}`).join('\n')
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

  lines.forEach((line, index) => {
    if (index === 0 && !line.includes(':') && !line.includes('：')) {
      resume.basics.name = line
      return
    }

    const [rawKey, ...rest] = line.split(/[:：]/)
    const value = rest.join(':').trim()
    const key = rawKey.trim().toLowerCase()

    if (!value) {
      const merged = line.replace(/^- /, '')
      resume.basics.summary = resume.basics.summary ? `${resume.basics.summary}\n${merged}` : merged
      return
    }

    if (['姓名', 'name'].includes(key)) resume.basics.name = value
    else if (['职位', 'title'].includes(key)) resume.basics.title = value
    else if (['邮箱', 'email'].includes(key)) resume.basics.email = value
    else if (['电话', '手机', 'phone'].includes(key)) resume.basics.phone = value
    else if (['地点', '城市', 'location'].includes(key)) resume.basics.location = value
    else if (['网站', 'website'].includes(key)) resume.basics.website = value
    else if (['github'].includes(key)) resume.basics.github = value
    else if (['简介', 'summary'].includes(key)) resume.basics.summary = value
  })
}

function listItemToText(item: ListItem): string {
  return item.children.map((child) => toString(child as Content)).join('\n').trim()
}

function extractItems(type: SectionType, nodes: RootContent[]): ResumeSection {
  const section = createDefaultSection(type)
  const items: ReturnType<typeof createEmptyItem>[] = []
  let currentItem = createEmptyItem()
  let bufferedNodes: RootContent[] = []

  const flush = () => {
    currentItem.descriptionMarkdown = nodesToMarkdown(bufferedNodes)
    if (currentItem.title || currentItem.subtitle || currentItem.descriptionMarkdown) {
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
            descriptionMarkdown: listItemToText(listItem),
          }),
        )
      })
      return
    }

    bufferedNodes.push(node)
  })

  flush()
  section.items = items.length > 0 ? items : [createEmptyItem({ descriptionMarkdown: nodesToMarkdown(nodes) })]
  return section
}

function blockChildren(node: Element): Element[] {
  return Array.from(node.children).filter((child) =>
    ['article', 'blockquote', 'div', 'h1', 'h2', 'h3', 'h4', 'img', 'li', 'ol', 'p', 'section', 'ul'].includes(
      child.tagName.toLowerCase(),
    ),
  )
}

function inlineMarkdownFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (!(node instanceof Element)) {
    return ''
  }

  const tag = node.tagName.toLowerCase()
  if (tag === 'img') {
    return ''
  }

  const content = Array.from(node.childNodes)
    .map((child) => inlineMarkdownFromNode(child))
    .join('')
    .trim()

  if (tag === 'strong' || tag === 'b') {
    return content ? `**${content}**` : ''
  }

  if (tag === 'em' || tag === 'i') {
    return content ? `*${content}*` : ''
  }

  if (tag === 'a') {
    const href = node.getAttribute('href')?.trim()
    if (!href) {
      return content
    }
    return `[${content || href}](${href})`
  }

  if (tag === 'br') {
    return '\n'
  }

  return content
}

function blockToMarkdown(node: Element, depth = 0): string {
  const tag = node.tagName.toLowerCase()
  const children = blockChildren(node)

  if (tag === 'img') {
    return ''
  }

  if (tag === 'h1') return `# ${cleanText(node.textContent ?? '')}`
  if (tag === 'h2') return `## ${cleanText(node.textContent ?? '')}`
  if (tag === 'h3') return `### ${cleanText(node.textContent ?? '')}`
  if (tag === 'h4') return `#### ${cleanText(node.textContent ?? '')}`

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child, index) => {
        const marker = tag === 'ol' ? `${index + 1}.` : '-'
        const nestedBlocks = blockChildren(child)
        if (nestedBlocks.length === 0) {
          return `${marker} ${inlineMarkdownFromNode(child).trim()}`
        }

        const inlineParts = Array.from(child.childNodes)
          .filter((childNode) => !(childNode instanceof Element && ['ul', 'ol'].includes(childNode.tagName.toLowerCase())))
          .map((childNode) => inlineMarkdownFromNode(childNode))
          .join('')
          .trim()
        const lines = inlineParts ? [`${marker} ${inlineParts}`] : [`${marker}`]
        nestedBlocks
          .filter((childBlock) => ['ul', 'ol'].includes(childBlock.tagName.toLowerCase()))
          .forEach((nestedList) => {
            const nestedMarkdown = blockToMarkdown(nestedList, depth + 1)
              .split('\n')
              .map((line) => `${'  '.repeat(depth + 1)}${line}`)
              .join('\n')
            lines.push(nestedMarkdown)
          })
        return lines.join('\n')
      })
      .join('\n')
  }

  if (children.length > 0 && ['div', 'section', 'article', 'body', 'main'].includes(tag)) {
    const mapped = children.map((child) => blockToMarkdown(child, depth)).filter(Boolean)
    if (mapped.length > 0) {
      return mapped.join('\n\n')
    }
  }

  if (tag === 'div') {
    const inlineParts = Array.from(node.children)
      .map((child) => inlineMarkdownFromNode(child).trim())
      .filter(Boolean)
    if (inlineParts.length > 0) {
      return inlineParts.join(' | ')
    }
  }

  return inlineMarkdownFromNode(node).trim()
}

function exportHtmlToMarkdown(html: string): string {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const blocks = Array.from(document.body.children)
    .map((child) => blockToMarkdown(child))
    .filter(Boolean)

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
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

  if (resume.basics.summary.trim()) {
    blocks.push('## 个人简介')
    blocks.push(resume.basics.summary.trim())
  }

  sections.forEach((section) => {
    blocks.push(`## ${section.label}`)

    section.items.forEach((item) => {
      if (section.type === 'skills') {
        const skillText = (item.descriptionMarkdown || item.title).trim()
        if (!skillText) {
          return
        }
        blocks.push(/^[-*]\s/m.test(skillText) ? skillText : `- ${skillText}`)
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

      if (item.descriptionMarkdown.trim()) {
        blocks.push(item.descriptionMarkdown.trim())
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
      exportHtmlToMarkdown(options.preferredHtml),
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

  return resume
}
