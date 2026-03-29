import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc ||= pdfWorkerUrl

const LINE_Y_TOLERANCE = 3

export interface PdfTextFragment {
  str: string
  x: number
  y: number
  fontSize: number
  fontName: string
  width: number
  page: number
}

interface PdfLine {
  items: PdfTextFragment[]
  text: string
  maxFontSize: number
  minX: number
  maxX: number
  isBold: boolean
  segments: string[]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function getFontSize(item: { transform: number[]; height?: number }): number {
  const [, b = 0, , d = 0] = item.transform
  const primary = Math.hypot(item.transform[0] ?? 0, b)
  const secondary = Math.hypot(item.transform[2] ?? 0, d)
  const fallback = Math.abs(item.height ?? 0)
  return Math.max(primary, secondary, fallback, 0)
}

function isMostlyAscii(value: string): boolean {
  return /^[\x00-\x7F\s]+$/.test(value)
}

function joinLineItems(items: PdfTextFragment[]): string {
  let result = ''

  items.forEach((item, index) => {
    const text = cleanText(item.str)
    if (!text) {
      return
    }

    if (index === 0) {
      result = text
      return
    }

    const previous = items[index - 1]
    const gap = item.x - (previous.x + previous.width)
    const previousText = cleanText(previous.str)
    const shouldInsertSpace =
      gap > Math.max(2.5, Math.min(item.fontSize, previous.fontSize) * 0.3) &&
      (isMostlyAscii(previousText) || isMostlyAscii(text) || /\d/.test(previousText + text))

    result += `${shouldInsertSpace ? ' ' : ''}${text}`
  })

  return cleanText(result)
}

function splitLineSegments(items: PdfTextFragment[]): string[] {
  const segments: PdfTextFragment[][] = []
  let current: PdfTextFragment[] = []

  items.forEach((item, index) => {
    if (index === 0) {
      current = [item]
      return
    }

    const previous = items[index - 1]
    const gap = item.x - (previous.x + previous.width)
    const threshold = Math.max(16, Math.max(item.fontSize, previous.fontSize) * 1.8)

    if (gap >= threshold) {
      segments.push(current)
      current = [item]
      return
    }

    current.push(item)
  })

  if (current.length > 0) {
    segments.push(current)
  }

  return segments.map((segment) => joinLineItems(segment)).filter(Boolean)
}

function buildLines(items: PdfTextFragment[]): PdfLine[] {
  const byPage = new Map<number, PdfTextFragment[]>()

  items.forEach((item) => {
    const list = byPage.get(item.page) ?? []
    list.push(item)
    byPage.set(item.page, list)
  })

  const pages = Array.from(byPage.keys()).sort((a, b) => a - b)
  const lines: PdfLine[] = []

  pages.forEach((page) => {
    const pageItems = (byPage.get(page) ?? []).sort((a, b) => b.y - a.y || a.x - b.x)
    let currentY = Number.NaN
    let currentLine: PdfTextFragment[] = []

    const flush = (): void => {
      if (currentLine.length === 0) {
        return
      }

      const sorted = [...currentLine].sort((a, b) => a.x - b.x)
      const text = joinLineItems(sorted)
      if (!text) {
        currentLine = []
        return
      }

      lines.push({
        items: sorted,
        text,
        maxFontSize: Math.max(...sorted.map((entry) => entry.fontSize)),
        minX: Math.min(...sorted.map((entry) => entry.x)),
        maxX: Math.max(...sorted.map((entry) => entry.x + entry.width)),
        isBold: sorted.some((entry) => /bold|heavy|black|semibold|demi/i.test(entry.fontName)),
        segments: splitLineSegments(sorted),
      })
      currentLine = []
    }

    pageItems.forEach((item) => {
      if (currentLine.length === 0) {
        currentY = item.y
        currentLine = [item]
        return
      }

      if (Math.abs(currentY - item.y) <= LINE_Y_TOLERANCE) {
        currentLine.push(item)
        return
      }

      flush()
      currentY = item.y
      currentLine = [item]
    })

    flush()
  })

  return lines
}

function detectBaseFontSize(items: PdfTextFragment[]): number {
  const counts = new Map<number, number>()

  items.forEach((item) => {
    const rounded = Math.max(1, Math.round(item.fontSize))
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1)
  })

  const mostCommon = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
  return mostCommon?.[0] ?? 12
}

function looksLikeSectionHeading(text: string): boolean {
  return /教育|学校|工作|实习|项目|技能|评价|经历|背景|证书|荣誉|校园/i.test(text)
}

function looksLikeList(text: string): boolean {
  return /^[•·●▪■\-]/.test(text)
}

function looksLikeRightMeta(text: string): boolean {
  return /\b\d{4}[./-]\d{1,2}\b|\b\d{4}\b|至今|现在|Present|GPA|本科|硕士|博士/i.test(text)
}

function lineToBlock(line: PdfLine, baseFontSize: number): string {
  const safeText = escapeHtml(line.text)
  const headingBoost = line.maxFontSize - baseFontSize
  const isMainTitle = line.maxFontSize >= baseFontSize + 5 || line.maxFontSize >= baseFontSize * 1.45
  const isSectionTitle = looksLikeSectionHeading(line.text) || headingBoost >= 2

  if (isMainTitle) {
    return `<h1>${safeText}</h1>`
  }

  if (isSectionTitle) {
    return `<h2>${safeText}</h2>`
  }

  if (looksLikeList(line.text)) {
    const cleaned = escapeHtml(line.text.replace(/^[•·●▪■\-]\s*/, ''))
    return `<li>${cleaned}</li>`
  }

  if (line.segments.length >= 2) {
    const right = line.segments.at(-1) ?? ''
    const left = line.segments.slice(0, -1).join(' ')
    if (left && right && looksLikeRightMeta(right) && line.maxX - line.minX > 160) {
      return `<div><span>${escapeHtml(left)}</span><span>${escapeHtml(right)}</span></div>`
    }
  }

  if (line.isBold) {
    return `<p><strong>${safeText}</strong></p>`
  }

  return `<p>${safeText}</p>`
}

function wrapListBlocks(blocks: string[]): string {
  let html = ''
  let listBuffer: string[] = []

  const flushList = (): void => {
    if (listBuffer.length === 0) {
      return
    }

    html += `<ul>\n${listBuffer.join('\n')}\n</ul>\n`
    listBuffer = []
  }

  blocks.forEach((block) => {
    if (block.startsWith('<li>')) {
      listBuffer.push(block)
      return
    }

    flushList()
    html += `${block}\n`
  })

  flushList()
  return html.trim()
}

export function buildStructuredHtmlFromPdfItems(items: PdfTextFragment[]): string {
  const filtered = items.filter((item) => cleanText(item.str))
  if (filtered.length === 0) {
    return ''
  }

  const baseFontSize = detectBaseFontSize(filtered)
  const lines = buildLines(filtered)
  const blocks = lines.map((line) => lineToBlock(line, baseFontSize)).filter(Boolean)
  return wrapListBlocks(blocks)
}

export async function extractStructuredHtmlFromPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  const items: PdfTextFragment[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()

    textContent.items.forEach((item) => {
      if (!('str' in item)) {
        return
      }

      const text = cleanText(item.str)
      if (!text) {
        return
      }

      items.push({
        str: text,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        fontSize: getFontSize(item),
        fontName: 'fontName' in item ? String(item.fontName ?? '') : '',
        width: Math.abs('width' in item ? Number(item.width ?? 0) : 0),
        page: pageNumber,
      })
    })
  }

  return buildStructuredHtmlFromPdfItems(items)
}
