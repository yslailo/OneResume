import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

import { importResumeFromHtmlContent, importResumeFromMarkdown } from '@/persistence/markdownExchange'
import type { ResumeDocument } from '@/domain/types'
import { normalizeSectionHeading } from '@/domain/resume'
import { extractStructuredHtmlFromPdf } from '@/utils/smartPdfParser'

pdfjsLib.GlobalWorkerOptions.workerSrc ||= pdfWorkerUrl

function hasMeaningfulResumeContent(resume: ResumeDocument): boolean {
  if (
    resume.basics.name.trim() ||
    resume.basics.title.trim() ||
    resume.basics.email.trim() ||
    resume.basics.phone.trim()
  ) {
    return true
  }

  return resume.sections.some((section) =>
    section.items.some(
      (item) =>
        item.title.trim() ||
        item.subtitle.trim() ||
        item.descriptionHtml.trim() ||
        item.highlights.length > 0,
    ),
  )
}

function normalizePdfText(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function looksLikeName(line: string): boolean {
  return !/\d|@|https?:\/\/|求职意向|教育背景|工作经历|实习经历|项目经历|专业技能/i.test(line) && line.length <= 24
}

function looksLikeTitle(line: string): boolean {
  return !/\d|@|https?:\/\/|教育背景|工作经历|实习经历|项目经历|专业技能/i.test(line) && line.length <= 40
}

function normalizeSectionLine(line: string): string | null {
  const cleaned = line.replace(/[：:]/g, '').trim()
  return normalizeSectionHeading(cleaned) ? cleaned : null
}

export function convertPdfTextToMarkdown(text: string): string {
  const lines = normalizePdfText(text)
  if (lines.length === 0) {
    return '# 个人信息'
  }

  let cursor = 0
  const basics: string[] = ['# 个人信息']

  if (looksLikeName(lines[cursor])) {
    basics.push(`姓名: ${lines[cursor]}`)
    cursor += 1
  }

  if (cursor < lines.length) {
    const titleMatch = lines[cursor].match(/求职意向[:：]?\s*(.+)$/)
    if (titleMatch?.[1]) {
      basics.push(`职位: ${titleMatch[1].trim()}`)
      cursor += 1
    } else if (looksLikeTitle(lines[cursor])) {
      basics.push(`职位: ${lines[cursor]}`)
      cursor += 1
    }
  }

  const summaryLines: string[] = []
  const contentBlocks: string[] = []
  let currentSection: string | null = null

  const pushLine = (line: string): void => {
    if (!currentSection) {
      summaryLines.push(line)
      return
    }

    const normalizedBullet = line.replace(/^[•·●▪■\-]\s*/, '').trim()
    contentBlocks.push(/^[•·●▪■\-]/.test(line) ? `- ${normalizedBullet}` : line)
  }

  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]
    const sectionHeading = normalizeSectionLine(line)
    if (sectionHeading) {
      currentSection = sectionHeading
      contentBlocks.push(`# ${sectionHeading}`)
      continue
    }

    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    if (emailMatch) {
      basics.push(`邮箱: ${emailMatch[0]}`)
      continue
    }

    const phoneMatch = line.match(/1[3-9]\d{9}/)
    if (phoneMatch) {
      basics.push(`电话: ${phoneMatch[0]}`)
      continue
    }

    if (!currentSection && /github\.com|https?:\/\//i.test(line)) {
      if (/github\.com/i.test(line)) basics.push(`GitHub: ${line}`)
      else basics.push(`网站: ${line}`)
      continue
    }

    if (!currentSection && /省|市|区|县|湖北|上海|北京|广州|深圳|杭州|成都|黄石/.test(line)) {
      basics.push(`地点: ${line}`)
      continue
    }

    pushLine(line)
  }

  if (summaryLines.length > 0) {
    basics.push(`简介: ${summaryLines.join(' / ')}`)
  }

  return [...basics, ...contentBlocks].join('\n\n').trim()
}

export function importResumeFromPdfText(text: string, existingTitles: string[]): ResumeDocument {
  return importResumeFromMarkdown(convertPdfTextToMarkdown(text), existingTitles)
}

export async function importResumeFromPdf(
  file: File,
  existingTitles: string[],
): Promise<{ resume: ResumeDocument; strategy: 'smart-html' | 'plain-text' }> {
  const structuredHtml = await extractStructuredHtmlFromPdf(file)

  if (structuredHtml.trim()) {
    const structuredResume = importResumeFromHtmlContent(structuredHtml, existingTitles, {
      preserveSourceHtml: false,
    })

    if (hasMeaningfulResumeContent(structuredResume)) {
      return { resume: structuredResume, strategy: 'smart-html' }
    }
  }

  const text = await extractTextFromPdf(file)
  if (!text.trim()) {
    throw new Error('PDF 未提取到可用文本，请尽量导入文字版 PDF')
  }

  return {
    resume: importResumeFromPdfText(text, existingTitles),
    strategy: 'plain-text',
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const pageLines: string[] = []
    let currentLine = ''

    textContent.items.forEach((item) => {
      if (!('str' in item)) {
        return
      }

      currentLine += item.str
      if (item.hasEOL) {
        pageLines.push(currentLine.trim())
        currentLine = ''
      } else {
        currentLine += ' '
      }
    })

    if (currentLine.trim()) {
      pageLines.push(currentLine.trim())
    }

    pages.push(pageLines.join('\n'))
  }

  return pages.join('\n\n').trim()
}
