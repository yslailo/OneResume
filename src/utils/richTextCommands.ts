export type InlineFormat = 'bold' | 'italic'

const FORMAT_TAGS: Record<InlineFormat, string[]> = {
  bold: ['strong', 'b'],
  italic: ['em', 'i'],
}

const INLINE_STYLE_TAGS = ['strong', 'b', 'em', 'i', 'a']

function hasFormatStyle(element: HTMLElement, format: InlineFormat): boolean {
  const style = element.getAttribute('style')?.toLowerCase() ?? ''

  if (format === 'bold') {
    return /font-weight:\s*(bold|[5-9]00)/.test(style)
  }

  return /font-style:\s*italic/.test(style)
}

export function selectionInsideEditor(editor: HTMLElement, selection: Selection | null): boolean {
  return Boolean(selection?.anchorNode && editor.contains(selection.anchorNode))
}

export function closestTagAncestor(editor: HTMLElement, node: Node | null, tags: string[]): HTMLElement | null {
  let cursor: Node | null = node

  while (cursor && cursor !== editor) {
    if (cursor instanceof HTMLElement) {
      const tag = cursor.tagName.toLowerCase()
      if (tags.includes(tag)) {
        return cursor
      }
    }
    cursor = cursor.parentNode
  }

  return null
}

export function selectionHasInlineFormat(
  editor: HTMLElement,
  selection: Selection | null,
  format: InlineFormat,
): boolean {
  if (!selectionInsideEditor(editor, selection)) {
    return false
  }

  const ancestor = closestFormatAncestor(editor, selection?.anchorNode ?? null, format)
  if (ancestor) {
    return true
  }

  return false
}

export function selectionHasBlockTag(
  editor: HTMLElement,
  selection: Selection | null,
  tags: string[],
): boolean {
  return Boolean(closestTagAncestor(editor, selection?.anchorNode ?? null, tags))
}

export function canToggleInlineFormat(
  editor: HTMLElement,
  selection: Selection | null,
  format: InlineFormat,
): boolean {
  if (!selectionInsideEditor(editor, selection)) {
    return false
  }

  if (!selection?.isCollapsed) {
    return true
  }

  return selectionHasInlineFormat(editor, selection, format)
}

function isInlineStyleElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase()
  return INLINE_STYLE_TAGS.includes(tag) || hasFormatStyle(element, 'bold') || hasFormatStyle(element, 'italic')
}

function closestInlineStyleAncestor(editor: HTMLElement, node: Node | null): HTMLElement | null {
  let cursor: Node | null = node

  while (cursor && cursor !== editor) {
    if (cursor instanceof HTMLElement && isInlineStyleElement(cursor)) {
      return cursor
    }
    cursor = cursor.parentNode
  }

  return null
}

export function normalizeCollapsedCaret(editor: HTMLElement, selection: Selection | null): boolean {
  if (!selectionInsideEditor(editor, selection) || !selection?.isCollapsed || selection.rangeCount === 0) {
    return false
  }

  const inlineAncestor = closestInlineStyleAncestor(editor, selection.anchorNode)
  if (!inlineAncestor) {
    return false
  }

  const currentRange = selection.getRangeAt(0)
  const startProbe = currentRange.cloneRange()
  startProbe.selectNodeContents(inlineAncestor)
  startProbe.setEnd(currentRange.startContainer, currentRange.startOffset)

  const endProbe = currentRange.cloneRange()
  endProbe.selectNodeContents(inlineAncestor)
  endProbe.setStart(currentRange.startContainer, currentRange.startOffset)

  const atStart = startProbe.toString().length === 0
  const atEnd = endProbe.toString().length === 0

  if (!atStart && !atEnd) {
    return false
  }

  const nextRange = document.createRange()
  if (atEnd) {
    nextRange.setStartAfter(inlineAncestor)
  } else {
    nextRange.setStartBefore(inlineAncestor)
  }
  nextRange.collapse(true)

  selection.removeAllRanges()
  selection.addRange(nextRange)
  return true
}

export function selectionTouchesInlineStyle(editor: HTMLElement, selection: Selection | null): boolean {
  if (!selectionInsideEditor(editor, selection) || !selection || selection.rangeCount === 0) {
    return false
  }

  if (selectionHasInlineFormat(editor, selection, 'bold') || selectionHasInlineFormat(editor, selection, 'italic')) {
    return true
  }

  const fragment = selection.getRangeAt(0).cloneContents()
  const probe = document.createElement('div')
  probe.appendChild(fragment)

  return Boolean(probe.querySelector('strong, b, em, i, a, [style*="font-weight"], [style*="font-style"]'))
}

export function shouldResetStickyInlineFormat(
  editor: HTMLElement,
  selection: Selection | null,
  format: InlineFormat,
  commandState: boolean,
): boolean {
  if (!selectionInsideEditor(editor, selection) || !selection?.isCollapsed) {
    return false
  }

  if (!commandState) {
    return false
  }

  return !selectionHasInlineFormat(editor, selection, format)
}

function closestFormatAncestor(
  editor: HTMLElement,
  node: Node | null,
  format: InlineFormat,
): HTMLElement | null {
  let cursor: Node | null = node

  while (cursor && cursor !== editor) {
    if (cursor instanceof HTMLElement) {
      const tag = cursor.tagName.toLowerCase()
      if (FORMAT_TAGS[format].includes(tag) || hasFormatStyle(cursor, format)) {
        return cursor
      }
    }
    cursor = cursor.parentNode
  }

  return null
}

function unwrapFormatInNode(node: Node, format: InlineFormat): void {
  if (!(node instanceof Element)) {
    return
  }

  Array.from(node.children).forEach((child) => unwrapFormatInNode(child, format))

  if (!(node instanceof HTMLElement)) {
    return
  }

  const tag = node.tagName.toLowerCase()
  if (!FORMAT_TAGS[format].includes(tag) && !hasFormatStyle(node, format)) {
    return
  }

  while (node.firstChild) {
    node.parentNode?.insertBefore(node.firstChild, node)
  }
  node.remove()
}

function selectionCoversWholeElement(range: Range, element: HTMLElement): boolean {
  const startProbe = range.cloneRange()
  startProbe.selectNodeContents(element)
  startProbe.setEnd(range.startContainer, range.startOffset)

  const endProbe = range.cloneRange()
  endProbe.selectNodeContents(element)
  endProbe.setStart(range.endContainer, range.endOffset)

  return startProbe.toString().length === 0 && endProbe.toString().length === 0
}

function selectInsertedNodes(selection: Selection, nodes: Node[]): void {
  if (nodes.length === 0) {
    return
  }

  const range = document.createRange()
  const first = nodes[0]
  const last = nodes[nodes.length - 1]

  if (first.nodeType === Node.TEXT_NODE) {
    range.setStart(first, 0)
  } else {
    range.setStartBefore(first)
  }

  if (last.nodeType === Node.TEXT_NODE) {
    range.setEnd(last, last.textContent?.length ?? 0)
  } else {
    range.setEndAfter(last)
  }

  selection.removeAllRanges()
  selection.addRange(range)
}

export function toggleInlineFormat(editor: HTMLElement, selection: Selection | null, format: InlineFormat): boolean {
  if (!selectionInsideEditor(editor, selection) || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false
  }

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  if (!selectedText.trim()) {
    return false
  }

  const startFormat = closestFormatAncestor(editor, range.startContainer, format)
  const endFormat = closestFormatAncestor(editor, range.endContainer, format)
  const fullyInsideSameFormat = Boolean(startFormat && startFormat === endFormat)

  if (fullyInsideSameFormat && startFormat && selectionCoversWholeElement(range, startFormat)) {
    const nodes = Array.from(startFormat.childNodes)
    const parent = startFormat.parentNode
    if (!parent) {
      return false
    }

    nodes.forEach((node) => parent.insertBefore(node, startFormat))
    startFormat.remove()
    editor.normalize()
    selectInsertedNodes(selection, nodes)
    return true
  }

  const fragment = range.extractContents()
  unwrapFormatInNode(fragment, format)

  const insertFragment = document.createDocumentFragment()
  let insertedNodes: Node[] = []

  if (fullyInsideSameFormat) {
    insertedNodes = Array.from(fragment.childNodes)
    insertFragment.appendChild(fragment)
  } else {
    const wrapper = document.createElement(format === 'bold' ? 'strong' : 'em')
    wrapper.appendChild(fragment)
    insertFragment.appendChild(wrapper)
    insertedNodes = [wrapper]
  }

  range.insertNode(insertFragment)
  editor.normalize()
  selectInsertedNodes(selection, insertedNodes)
  return true
}
