export interface WrappedSelectionResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

export function wrapSelectionWithMarker(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
): WrappedSelectionResult {
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(start, Math.max(selectionStart, selectionEnd))
  const selectedText = value.slice(start, end)
  const insertion = `${marker}${selectedText}${marker}`
  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
  const innerStart = start + marker.length
  const innerEnd = innerStart + selectedText.length

  return {
    value: nextValue,
    selectionStart: innerStart,
    selectionEnd: innerEnd,
  }
}

export function prefixLinesInSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  createPrefix: (index: number) => string,
): WrappedSelectionResult {
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(start, Math.max(selectionStart, selectionEnd))
  const blockStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const nextLineBreak = value.indexOf('\n', end)
  const blockEnd = nextLineBreak === -1 ? value.length : nextLineBreak
  const block = value.slice(blockStart, blockEnd)
  const lines = block.split('\n')
  const transformed = lines.map((line, index) => `${createPrefix(index)}${line}`).join('\n')
  const nextValue = `${value.slice(0, blockStart)}${transformed}${value.slice(blockEnd)}`

  return {
    value: nextValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + transformed.length,
  }
}

export function insertMarkdownLink(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): WrappedSelectionResult {
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(start, Math.max(selectionStart, selectionEnd))
  const selectedText = value.slice(start, end)
  const label = selectedText || '链接文本'
  const insertion = `[${label}](https://example.com)`
  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
  const labelStart = start + 1

  return {
    value: nextValue,
    selectionStart: labelStart,
    selectionEnd: labelStart + label.length,
  }
}
