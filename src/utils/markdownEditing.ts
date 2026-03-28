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
