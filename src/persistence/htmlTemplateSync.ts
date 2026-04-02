import { normalizeSectionHeading } from '@/domain/resume'
import type { ResumeDocument, ResumeItem, ResumeSection } from '@/domain/types'
import { normalizeRichTextHtml } from '@/utils/richTextContent'

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim()
}

function isBefore(node: Node, target: Node): boolean {
  return Boolean(node.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)
}

function cloneTemplate<T extends Element>(document: Document, template: T | null | undefined, tagName: string): T {
  return ((template?.cloneNode(true) as T | undefined) ?? (document.createElement(tagName) as unknown as T))
}

function setTextContent(element: Element, text: string): void {
  element.textContent = text
}

function dateRange(item: ResumeItem): string {
  return [item.startDate, item.endDate].filter(Boolean).join(' - ')
}

function collectSectionElements(heading: Element): Element[] {
  const elements: Element[] = []
  let cursor = heading.nextElementSibling

  while (cursor && cursor.tagName.toLowerCase() !== 'h2') {
    elements.push(cursor)
    cursor = cursor.nextElementSibling
  }

  return elements
}

function htmlBlocksToNodes(document: Document, html: string, paragraphTemplate?: Element | null, listTemplate?: Element | null): Element[] {
  const normalized = normalizeRichTextHtml(html)
  if (!normalized) {
    return []
  }

  const wrapper = document.createElement('div')
  wrapper.innerHTML = normalized

  return Array.from(wrapper.children).map((child) => {
    if (child.tagName.toLowerCase() === 'p') {
      const paragraph = cloneTemplate(document, paragraphTemplate, 'p')
      paragraph.innerHTML = child.innerHTML
      return paragraph
    }

    if (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol') {
      const list = cloneTemplate(document, listTemplate, child.tagName.toLowerCase())
      const listItemTemplate = listTemplate?.querySelector('li')
      list.innerHTML = ''
      Array.from(child.children).forEach((entry) => {
        const listItem = cloneTemplate(document, listItemTemplate, 'li')
        listItem.innerHTML = entry.innerHTML
        list.appendChild(listItem)
      })
      return list
    }

    return child.cloneNode(true) as Element
  })
}

function buildHeaderBlock(document: Document, containerTemplate: Element | null | undefined, item: ResumeItem, secondLine: string): Element {
  const header = cloneTemplate(document, containerTemplate, 'div')
  const spans = Array.from(header.querySelectorAll('span'))

  if (spans.length >= 2) {
    setTextContent(spans[0], item.title)
    setTextContent(spans[1], secondLine)
    spans.slice(2).forEach((span) => span.remove())
    return header
  }

  header.innerHTML = ''
  const left = document.createElement('span')
  left.textContent = item.title
  const right = document.createElement('span')
  right.textContent = secondLine
  header.append(left, right)
  return header
}

function buildRoleParagraph(document: Document, template: Element | null | undefined, text: string): Element | null {
  if (!text) {
    return null
  }

  const paragraph = cloneTemplate(document, template, 'p')
  paragraph.textContent = text
  return paragraph
}

function createGenericHeading(document: Document, template: Element | undefined, label: string): Element {
  const heading = cloneTemplate(document, template, 'h2')
  heading.textContent = label
  return heading
}

function renderSectionNodes(document: Document, section: ResumeSection, existingElements: Element[]): Element[] {
  const headerTemplate = existingElements.find((element) => element.tagName.toLowerCase() === 'div')
  const paragraphTemplates = existingElements.filter((element) => element.tagName.toLowerCase() === 'p')
  const paragraphTemplate = paragraphTemplates[0]
  const secondaryParagraphTemplate = paragraphTemplates[1] ?? paragraphTemplate
  const listTemplate = existingElements.find((element) => ['ul', 'ol'].includes(element.tagName.toLowerCase()))

  if (section.type === 'skills') {
    const list = cloneTemplate(document, listTemplate, 'ul')
    const listItemTemplate = listTemplate?.querySelector('li')
    list.innerHTML = ''
    section.items.forEach((item) => {
      const nodes = htmlBlocksToNodes(document, item.descriptionHtml || (item.title ? `<p>${item.title}</p>` : ''), paragraphTemplate, listTemplate)
      if (nodes.length === 1 && ['ul', 'ol'].includes(nodes[0].tagName.toLowerCase())) {
        Array.from(nodes[0].children).forEach((entry) => {
          const listItem = cloneTemplate(document, listItemTemplate, 'li')
          listItem.innerHTML = entry.innerHTML
          list.appendChild(listItem)
        })
        return
      }

      const listItem = cloneTemplate(document, listItemTemplate, 'li')
      listItem.innerHTML = (item.descriptionHtml || item.title || '').trim()
      list.appendChild(listItem)
    })
    return [list]
  }

  const fragments: Element[] = []

  section.items.forEach((item) => {
    if (section.type === 'education') {
      fragments.push(buildHeaderBlock(document, headerTemplate, item, dateRange(item)))
      fragments.push(...htmlBlocksToNodes(document, item.descriptionHtml, paragraphTemplate, listTemplate))
      return
    }

    if (section.type === 'work') {
      fragments.push(buildHeaderBlock(document, headerTemplate, item, dateRange(item)))
      const role = buildRoleParagraph(document, paragraphTemplate, item.subtitle)
      if (role) {
        fragments.push(role)
      }
      fragments.push(...htmlBlocksToNodes(document, item.descriptionHtml, secondaryParagraphTemplate, listTemplate))
      return
    }

    if (section.type === 'project') {
      fragments.push(buildHeaderBlock(document, headerTemplate, item, item.subtitle || dateRange(item)))
      fragments.push(...htmlBlocksToNodes(document, item.descriptionHtml, paragraphTemplate, listTemplate))
      return
    }

    if (section.type === 'custom') {
      if (item.title) {
        const paragraph = cloneTemplate(document, paragraphTemplate, 'p')
        paragraph.innerHTML = item.subtitle ? `<strong>${item.title}</strong>：${item.subtitle}` : `<strong>${item.title}</strong>`
        fragments.push(paragraph)
      } else if (item.subtitle) {
        const paragraph = cloneTemplate(document, paragraphTemplate, 'p')
        paragraph.textContent = item.subtitle
        fragments.push(paragraph)
      }

      fragments.push(...htmlBlocksToNodes(document, item.descriptionHtml, secondaryParagraphTemplate, listTemplate))
    }
  })

  return fragments
}

function patchLocationLine(original: string, location: string): string {
  if (!location) {
    return original
  }

  if (original.includes('|')) {
    const parts = original.split('|').map((part) => part.trim())
    parts[parts.length - 1] = location
    return parts.join(' | ')
  }

  return location
}

function patchHeader(document: Document, resume: ResumeDocument, photoUrl: string | null): void {
  const firstHeading = document.querySelector('h2')
  const h1 = document.querySelector('h1')
  if (h1 && resume.basics.name) {
    h1.textContent = resume.basics.name
  }

  const leadingParagraphs = Array.from(document.querySelectorAll('p')).filter((node) => !firstHeading || isBefore(node, firstHeading))
  leadingParagraphs.forEach((paragraph) => {
    const text = cleanText(paragraph.textContent ?? '')
    if (!text) {
      return
    }

    if (/求职意向[:：]/.test(text) && resume.basics.title) {
      const strong = paragraph.querySelector('strong')
      if (strong) {
        strong.textContent = `求职意向：${resume.basics.title}`
      } else {
        paragraph.textContent = `求职意向：${resume.basics.title}`
      }
      return
    }

    const hasContact = /@/.test(text) || /1[3-9]\d{9}/.test(text)
    if (hasContact && (resume.basics.phone || resume.basics.email)) {
      paragraph.textContent = [resume.basics.phone, resume.basics.email].filter(Boolean).join(' | ')
      return
    }

    if ((text.includes('|') || text.includes('·')) && resume.basics.location) {
      paragraph.textContent = patchLocationLine(text, resume.basics.location)
    }
  })

  const summaryHost = leadingParagraphs.find((paragraph) => paragraph.textContent && paragraph.textContent.length > 20)
  if (summaryHost && resume.basics.summaryHtml) {
    summaryHost.innerHTML = resume.basics.summaryHtml
  }

  const headerImage = Array.from(document.querySelectorAll('img')).find((node) => !firstHeading || isBefore(node, firstHeading))
  if (!headerImage) {
    return
  }

  if (resume.style.showPhoto && photoUrl) {
    headerImage.setAttribute('src', photoUrl)
    headerImage.setAttribute('style', `${headerImage.getAttribute('style') ?? ''}; display: block !important;`)
  } else {
    headerImage.setAttribute('style', `${headerImage.getAttribute('style') ?? ''}; display: none !important;`)
  }
}

function findSectionByHeading(resume: ResumeDocument, label: string, usedIds: Set<string>): ResumeSection | undefined {
  const visibleSections = resume.sections.filter((section) => section.visible && section.items.length > 0 && !usedIds.has(section.id))
  return (
    visibleSections.find((section) => section.label === label) ??
    visibleSections.find((section) => normalizeSectionHeading(section.label) === normalizeSectionHeading(label)) ??
    visibleSections.find((section) => section.type === (normalizeSectionHeading(label) ?? 'custom'))
  )
}

export function renderResumeIntoHtmlTemplate(templateHtml: string, resume: ResumeDocument, photoUrl: string | null): string {
  const parser = new DOMParser()
  const document = parser.parseFromString(templateHtml, 'text/html')
  const headings = Array.from(document.querySelectorAll('h2'))
  const headingTemplate = headings[0]
  const usedSectionIds = new Set<string>()

  patchHeader(document, resume, photoUrl)

  headings.forEach((heading) => {
    const label = cleanText(heading.textContent ?? '')
    const section = findSectionByHeading(resume, label, usedSectionIds)
    const content = collectSectionElements(heading)

    if (!section) {
      heading.remove()
      content.forEach((element) => element.remove())
      return
    }

    usedSectionIds.add(section.id)
    heading.textContent = section.label
    const replacementNodes = renderSectionNodes(document, section, content)
    const parent = heading.parentNode
    if (!parent) {
      return
    }
    const marker = document.createComment('section-sync-anchor')
    parent.insertBefore(marker, content.at(-1)?.nextSibling ?? heading.nextSibling)
    content.forEach((element) => element.remove())
    replacementNodes.forEach((node) => {
      parent.insertBefore(node, marker)
    })
    parent.removeChild(marker)
  })

  const unmatchedSections = resume.sections.filter(
    (section) => section.visible && section.items.length > 0 && !usedSectionIds.has(section.id),
  )

  let insertAfter = document.querySelector('h2:last-of-type') ?? document.body.lastElementChild
  unmatchedSections.forEach((section) => {
    const heading = createGenericHeading(document, headingTemplate ?? undefined, section.label)
    if (insertAfter?.parentNode) {
      insertAfter.parentNode.insertBefore(heading, insertAfter.nextSibling)
    } else {
      document.body.appendChild(heading)
    }
    insertAfter = heading

    const nodes = renderSectionNodes(document, section, [])
    nodes.forEach((node) => {
      insertAfter?.parentNode?.insertBefore(node, insertAfter.nextSibling)
      insertAfter = node
    })
  })

  return document.body.innerHTML
}
