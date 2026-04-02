import { renderMarkdown } from '@/utils/markdown'

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, ' ')
}

function isBoldElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase()
  const style = (element.getAttribute('style') ?? '').toLowerCase()
  return tag === 'strong' || tag === 'b' || /font-weight:\s*(bold|[5-9]00)/.test(style)
}

function isItalicElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase()
  const style = (element.getAttribute('style') ?? '').toLowerCase()
  return tag === 'em' || tag === 'i' || /font-style:\s*italic/.test(style)
}

function textFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeText(node.textContent ?? '')
  }

  if (!(node instanceof Element)) {
    return ''
  }

  const tag = node.tagName.toLowerCase()
  if (tag === 'br') {
    return '\n'
  }

  const content = Array.from(node.childNodes)
    .map((child) => textFromNode(child))
    .join('')

  if (tag === 'a') {
    const href = node.getAttribute('href')?.trim()
    if (!href) {
      return content
    }
    return `[${content || href}](${href})`
  }

  let next = content

  if (isBoldElement(node) && next.trim()) {
    next = `**${next}**`
  }

  if (isItalicElement(node) && next.trim()) {
    next = `*${next}*`
  }

  return next
}

function listItemToMarkdown(item: Element, ordered: boolean, depth: number, index: number): string {
  const marker = ordered ? `${index + 1}.` : '-'
  const nestedLists = Array.from(item.children).filter((child) => ['ul', 'ol'].includes(child.tagName.toLowerCase()))
  const inlineContent = Array.from(item.childNodes)
    .filter((child) => !(child instanceof Element && ['ul', 'ol'].includes(child.tagName.toLowerCase())))
    .map((child) => textFromNode(child))
    .join('')
    .trim()

  const lines = [`${marker}${inlineContent ? ` ${inlineContent}` : ''}`]

  nestedLists.forEach((list) => {
    const nestedMarkdown = blockToMarkdown(list, depth + 1)
      .split('\n')
      .map((line) => `${'  '.repeat(depth + 1)}${line}`)
      .join('\n')

    if (nestedMarkdown.trim()) {
      lines.push(nestedMarkdown)
    }
  })

  return lines.join('\n')
}

function blockToMarkdown(node: Node, depth = 0): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeText(node.textContent ?? '').trim()
  }

  if (!(node instanceof Element)) {
    return ''
  }

  const tag = node.tagName.toLowerCase()

  if (tag === 'h1') return `# ${textFromNode(node).trim()}`
  if (tag === 'h2') return `## ${textFromNode(node).trim()}`
  if (tag === 'h3') return `### ${textFromNode(node).trim()}`
  if (tag === 'h4') return `#### ${textFromNode(node).trim()}`

  if (tag === 'blockquote') {
    const content = textFromNode(node).trim()
    return content ? `> ${content}` : ''
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child, index) => listItemToMarkdown(child, tag === 'ol', depth, index))
      .join('\n')
  }

  if (tag === 'p') {
    return textFromNode(node).trim()
  }

  if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'main') {
    const childBlocks = Array.from(node.childNodes)
      .map((child) => blockToMarkdown(child, depth))
      .filter(Boolean)

    if (childBlocks.length > 0) {
      return childBlocks.join('\n\n')
    }
  }

  return textFromNode(node).trim()
}

export function normalizeRichTextHtml(html: string): string {
  const value = html.trim()
  if (!value) {
    return ''
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(`<div id="rt-root">${value}</div>`, 'text/html')
  const root = document.querySelector('#rt-root')

  if (!root) {
    return ''
  }

  const normalized = root.innerHTML.trim()
  return normalized === '<p></p>' || normalized === '<p><br></p>' ? '' : normalized
}

export function markdownToRichTextHtml(markdown: string): string {
  return normalizeRichTextHtml(renderMarkdown(markdown || '').trim())
}

export function richTextHtmlToMarkdown(html: string): string {
  const normalized = normalizeRichTextHtml(html)
  if (!normalized) {
    return ''
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(`<div id="editor-root">${normalized}</div>`, 'text/html')
  const root = document.querySelector('#editor-root')

  if (!root) {
    return ''
  }

  const blocks = Array.from(root.childNodes)
    .map((child) => blockToMarkdown(child))
    .filter(Boolean)

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function plainTextToRichTextHtml(value: string): string {
  const text = value.trim()
  if (!text) {
    return ''
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return normalizeRichTextHtml(paragraphs)
}
