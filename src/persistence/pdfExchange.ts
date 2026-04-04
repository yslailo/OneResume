import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

import { importResumeFromHtmlContent } from '@/persistence/markdownExchange'
import { parsePdfTextToResume } from '@/persistence/importParsers'
import type { ResumeDocument } from '@/domain/types'
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

export function importResumeFromPdfText(text: string, existingTitles: string[]): ResumeDocument {
  return parsePdfTextToResume(text, existingTitles)
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
