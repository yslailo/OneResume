/**
 * 导入解析引擎 —— 分层架构
 *
 * 原始内容 → ParsedResume（中间结构） → ResumeDocument（领域模型）
 *
 * 设计原则：
 *  1. 每个章节支持**多条目**解析
 *  2. 时间范围用正则提取，不依赖固定位置
 *  3. 基础信息从全文而非固定位置搜索
 *  4. 未识别章节降级为 custom，不丢失数据
 */

import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Heading, Root, RootContent } from 'mdast'

import {
  createDefaultSection,
  createEmptyItem,
  createImportedResume,
  normalizeSectionHeading,
} from '@/domain/resume'
import type { ResumeDocument, ResumeSection, SectionType } from '@/domain/types'
import { markdownToRichTextHtml, plainTextToRichTextHtml } from '@/utils/richTextContent'

// ─── 中间结构 ───────────────────────────────────────────────

interface ParsedContact {
  type: 'email' | 'phone' | 'location' | 'website' | 'github' | 'title'
  value: string
}

interface ParsedEntry {
  title: string
  subtitle: string
  startDate: string
  endDate: string
  location: string
  descriptionHtml: string
}

interface ParsedSection {
  heading: string
  type: SectionType | null
  entries: ParsedEntry[]
}

interface ParsedResume {
  name: string
  contacts: ParsedContact[]
  summary: string
  sections: ParsedSection[]
}

// ─── 工具函数 ───────────────────────────────────────────────

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim()
}

/**
 * 从文本中提取日期范围。
 * 支持格式：2020.09 - 2024.06, 2020/09-至今, 2020年9月-2024年6月, Sep 2020 - Present 等
 */
const DATE_RANGE_PATTERN =
  /(\d{4}[\s./-]\d{1,2}(?:月)?|\d{4}年\d{1,2}月|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]*\d{4})\s*[-–—~至到]+\s*(\d{4}[\s./-]\d{1,2}(?:月)?|\d{4}年\d{1,2}月|\d{4}|至今|现在|Present|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]*\d{4})/i

const SINGLE_DATE_PATTERN =
  /\b(\d{4}[\s./-]\d{1,2}(?:月)?|\d{4}年\d{1,2}月)\b/

function extractDateRange(text: string): { startDate: string; endDate: string; remaining: string } {
  const rangeMatch = text.match(DATE_RANGE_PATTERN)
  if (rangeMatch) {
    const remaining = text.replace(rangeMatch[0], '').trim()
    return { startDate: rangeMatch[1].trim(), endDate: rangeMatch[2].trim(), remaining }
  }

  const singleMatch = text.match(SINGLE_DATE_PATTERN)
  if (singleMatch) {
    const remaining = text.replace(singleMatch[0], '').trim()
    return { startDate: singleMatch[1].trim(), endDate: '', remaining }
  }

  return { startDate: '', endDate: '', remaining: text }
}

function extractPhone(text: string): string {
  const match = text.match(/1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/)
  return match ? match[0].replace(/[\s-]/g, '') : ''
}

function extractPhoneFormatted(text: string): string {
  const raw = extractPhone(text)
  if (!raw) return ''
  return raw.length === 11 ? `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}` : raw
}

function extractEmail(text: string): string {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ''
}

function extractUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  return match?.[0] ?? ''
}

function looksLikeSectionHeading(text: string): boolean {
  return normalizeSectionHeading(text) !== null
}

// ─── ParsedResume → ResumeDocument 转换 ───────────────────

function parsedResumeToDocument(
  parsed: ParsedResume,
  existingTitles: string[],
  sourceOptions: {
    sourceFormat?: 'structured' | 'html'
    previewMode?: 'structured' | 'source-html'
    rawSourceHtml?: string | null
  } = {},
): ResumeDocument {
  const resume = createImportedResume(
    { title: parsed.name ? `${parsed.name}的简历` : '导入简历' },
    existingTitles,
  )

  resume.basics.name = parsed.name

  // 填充联系方式
  for (const contact of parsed.contacts) {
    switch (contact.type) {
      case 'email':
        resume.basics.email ||= contact.value
        break
      case 'phone':
        resume.basics.phone ||= contact.value
        break
      case 'location':
        resume.basics.location ||= contact.value
        break
      case 'website':
        resume.basics.website ||= contact.value
        break
      case 'github':
        resume.basics.github ||= contact.value
        break
      case 'title':
        resume.basics.title ||= contact.value
        break
    }
  }

  resume.basics.summaryHtml = parsed.summary
    ? plainTextToRichTextHtml(parsed.summary)
    : ''

  // 转换章节
  const sections: ResumeSection[] = []

  for (const parsedSection of parsed.sections) {
    const type = parsedSection.type ?? 'custom'
    const section = createDefaultSection(type, { label: parsedSection.heading })

    if (parsedSection.entries.length > 0) {
      section.items = parsedSection.entries.map((entry) =>
        createEmptyItem({
          title: entry.title,
          subtitle: entry.subtitle,
          startDate: entry.startDate,
          endDate: entry.endDate,
          location: entry.location,
          descriptionHtml: entry.descriptionHtml,
        }),
      )
    } else {
      section.items = [createEmptyItem()]
    }

    // 过滤掉完全空的条目
    section.items = section.items.filter(
      (item) => item.title || item.subtitle || item.descriptionHtml,
    )

    if (section.items.length === 0) {
      section.items = [createEmptyItem()]
    }

    sections.push(section)
  }

  if (sections.length > 0) {
    resume.sections = sections
    resume.sectionOrder = sections.map((s) => s.id)
  }

  resume.sourceFormat = sourceOptions.sourceFormat ?? 'structured'
  resume.previewMode = sourceOptions.previewMode ?? 'structured'
  resume.rawSourceHtml = sourceOptions.rawSourceHtml ?? null

  return resume
}

// ─── HTML 解析 ─────────────────────────────────────────────

function extractContactsFromText(text: string, contacts: ParsedContact[]): void {
  const email = extractEmail(text)
  if (email) contacts.push({ type: 'email', value: email })

  const phone = extractPhoneFormatted(text)
  if (phone) contacts.push({ type: 'phone', value: phone })

  const url = extractUrl(text)
  if (url) {
    if (/github\.com/i.test(url)) {
      contacts.push({ type: 'github', value: url })
    } else {
      contacts.push({ type: 'website', value: url })
    }
  }

  // 求职意向匹配
  const titleMatch = text.match(/求职意向[：:]\s*(.+?)(?:\s*[|·•]|$)/)
  if (titleMatch) {
    contacts.push({ type: 'title', value: cleanText(titleMatch[1]) })
  }

  // 地址匹配
  if (/省|市|区|县|上海|北京|广州|深圳|杭州|成都|武汉|南京|西安|重庆/.test(text)) {
    const parts = text.split(/[|·•\\\/]/).map((p) => cleanText(p)).filter(Boolean)
    const locationPart = parts.find((p) =>
      /省|市|区|县|上海|北京|广州|深圳|杭州|成都|武汉|南京|西安|重庆/.test(p) &&
      !extractEmail(p) && !extractPhone(p),
    )
    if (locationPart && locationPart.length <= 20) {
      contacts.push({ type: 'location', value: locationPart })
    }
  }
}

/**
 * 判断一个 HTML 元素是否看起来像条目标题行（包含标题和/或时间信息）
 */
function looksLikeEntryHeader(element: Element): boolean {
  const tag = element.tagName.toLowerCase()
  if (tag === 'h3' || tag === 'h4') return true

  // 检查是否是粗体段落 / 包含日期的行
  const text = cleanText(element.textContent ?? '')
  if (!text) return false

  const hasDate = DATE_RANGE_PATTERN.test(text) || SINGLE_DATE_PATTERN.test(text)
  const isBold =
    tag === 'strong' ||
    element.querySelector('strong, b') !== null ||
    (element as HTMLElement).style?.fontWeight === 'bold'

  // div 内包含多个 span（常见的标题行格式）
  if (tag === 'div') {
    const spans = element.querySelectorAll('span')
    if (spans.length >= 2) return true
  }

  return (isBold && text.length <= 60) || (hasDate && text.length <= 80)
}

function htmlElementToRichText(element: Element): string {
  const tag = element.tagName.toLowerCase()
  if (['ul', 'ol', 'p', 'blockquote', 'h3', 'h4', 'table'].includes(tag)) {
    return element.outerHTML
  }
  const text = cleanText(element.textContent ?? '')
  return text ? `<p>${text}</p>` : ''
}

function parseHtmlEntries(elements: Element[], sectionType: SectionType | null): ParsedEntry[] {
  const entries: ParsedEntry[] = []
  let current: ParsedEntry | null = null
  let descBuffer: string[] = []

  function flushEntry(): void {
    if (!current) return
    current.descriptionHtml = descBuffer.join('')
    if (current.title || current.subtitle || current.descriptionHtml) {
      entries.push(current)
    }
    current = null
    descBuffer = []
  }

  // 技能类章节：直接把所有内容合并成一个富文本条目
  if (sectionType === 'skills') {
    const html = elements.map((el) => htmlElementToRichText(el)).filter(Boolean).join('')
    if (html) {
      entries.push({
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        location: '',
        descriptionHtml: html,
      })
    }
    return entries
  }

  for (const element of elements) {
    if (looksLikeEntryHeader(element)) {
      flushEntry()

      const tag = element.tagName.toLowerCase()
      const fullText = cleanText(element.textContent ?? '')
      const { startDate, endDate, remaining } = extractDateRange(fullText)

      // 从 div 里的 spans 提取标题和副标题
      const spans = Array.from(element.querySelectorAll('span'))
        .map((s) => cleanText(s.textContent ?? ''))
        .filter(Boolean)

      let title = ''
      let subtitle = ''
      let location = ''

      if (spans.length >= 2) {
        // 多 span 分段的标题行
        title = spans[0]
        // 过滤掉日期类 span
        const nonDateSpans = spans.slice(1).filter(
          (s) => !DATE_RANGE_PATTERN.test(s) && !SINGLE_DATE_PATTERN.test(s),
        )
        subtitle = nonDateSpans[0] ?? ''
        location = nonDateSpans[1] ?? ''
      } else if (tag === 'h3' || tag === 'h4') {
        title = remaining || fullText
      } else {
        // 用分隔符拆分的标题行
        const parts = remaining.split(/[|·•]/).map((p) => cleanText(p)).filter(Boolean)
        title = parts[0] ?? fullText
        subtitle = parts[1] ?? ''
        location = parts[2] ?? ''
      }

      current = {
        title,
        subtitle,
        startDate,
        endDate,
        location,
        descriptionHtml: '',
      }
    } else {
      // 非标题行：作为内容追加
      if (!current) {
        // 还没遇到条目标题，创建一个无标题条目
        current = {
          title: '',
          subtitle: '',
          startDate: '',
          endDate: '',
          location: '',
          descriptionHtml: '',
        }
      }

      const html = htmlElementToRichText(element)
      if (html) {
        descBuffer.push(html)
      }
    }
  }

  flushEntry()
  return entries
}

export function parseHtmlToResume(html: string, existingTitles: string[], options: { preserveSourceHtml?: boolean } = {}): ResumeDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const preserveSourceHtml = options.preserveSourceHtml ?? true

  const parsed: ParsedResume = {
    name: '',
    contacts: [],
    summary: '',
    sections: [],
  }

  // 1. 提取名字（h1）
  const h1 = doc.querySelector('h1')
  if (h1) {
    parsed.name = cleanText(h1.textContent ?? '')
  }

  // 2. 提取基础信息：h1 和第一个 h2 之间的所有内容
  const allH2s = Array.from(doc.querySelectorAll('h2'))
  const firstH2 = allH2s[0]

  // 收集 h1 后、第一个 h2 前的所有元素
  const headerElements: Element[] = []
  if (h1) {
    let cursor = h1.nextElementSibling
    while (cursor && cursor !== firstH2) {
      headerElements.push(cursor)
      cursor = cursor.nextElementSibling
    }
  } else {
    // 没有 h1，从 body 开始搜索到第一个 h2
    const bodyChildren = Array.from(doc.body.children)
    for (const child of bodyChildren) {
      if (child === firstH2) break
      headerElements.push(child)
    }
  }

  // 从头部元素提取联系方式
  const summaryLines: string[] = []
  for (const el of headerElements) {
    const text = cleanText(el.textContent ?? '')
    if (!text) continue
    extractContactsFromText(text, parsed.contacts)

    // 较长的段落可能是个人简介
    if (text.length > 30 && !extractEmail(text) && !extractPhone(text)) {
      summaryLines.push(text)
    }
  }
  parsed.summary = summaryLines.join('\n')

  // 3. 解析各章节
  for (const h2 of allH2s) {
    const heading = cleanText(h2.textContent ?? '')
    const type = normalizeSectionHeading(heading)

    // 收集该 h2 后到下一个 h2 之间的所有元素
    const sectionElements: Element[] = []
    let cursor = h2.nextElementSibling
    while (cursor && cursor.tagName.toLowerCase() !== 'h2') {
      sectionElements.push(cursor)
      cursor = cursor.nextElementSibling
    }

    const entries = parseHtmlEntries(sectionElements, type)

    parsed.sections.push({
      heading: heading || '未命名章节',
      type,
      entries,
    })
  }

  // 如果没有 h2，尝试用 h3 作为章节分隔
  if (allH2s.length === 0) {
    const allH3s = Array.from(doc.querySelectorAll('h3'))
    for (const h3 of allH3s) {
      const heading = cleanText(h3.textContent ?? '')
      const type = normalizeSectionHeading(heading)
      if (!type) continue

      const sectionElements: Element[] = []
      let cursor = h3.nextElementSibling
      while (cursor && cursor.tagName.toLowerCase() !== 'h3') {
        sectionElements.push(cursor)
        cursor = cursor.nextElementSibling
      }

      parsed.sections.push({
        heading,
        type,
        entries: parseHtmlEntries(sectionElements, type),
      })
    }
  }

  return parsedResumeToDocument(parsed, existingTitles, {
    sourceFormat: preserveSourceHtml ? 'html' : 'structured',
    previewMode: preserveSourceHtml ? 'source-html' : 'structured',
    rawSourceHtml: preserveSourceHtml ? html : null,
  })
}

// ─── Markdown 解析 ─────────────────────────────────────────

function headingText(node: Heading): string {
  return toString(node).trim()
}

function nodesAsMarkdown(nodes: RootContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'paragraph') return toString(node).trim()
      if (node.type === 'list') {
        const ordered = Boolean(node.ordered)
        return node.children
          .map((item, i) => `${ordered ? `${i + 1}.` : '-'} ${toString(item).trim()}`)
          .join('\n')
      }
      if (node.type === 'blockquote') return `> ${toString(node).trim()}`
      if (node.type === 'code') return `\`\`\`\n${node.value}\n\`\`\``
      return toString(node).trim()
    })
    .filter(Boolean)
    .join('\n\n')
}

interface MdGroup {
  heading: string
  depth: number
  nodes: RootContent[]
}

/**
 * 将 Markdown AST 按最高级别的 heading 切分成组。
 * 自动检测用于章节分隔的 heading 层级（h1 或 h2）。
 */
function splitMarkdownIntoGroups(root: Root): MdGroup[] {
  const groups: MdGroup[] = []

  // 检测章节 heading 层级：如果有多个 h1，用 h1 分组；否则用 h2
  const headings = root.children.filter((n): n is Heading => n.type === 'heading')
  const h1Count = headings.filter((h) => h.depth === 1).length
  const h2Count = headings.filter((h) => h.depth === 2).length
  const sectionDepth = h1Count >= 2 ? 1 : h2Count >= 2 ? 2 : 1

  let current: MdGroup | null = null

  for (const node of root.children) {
    if (node.type === 'heading' && node.depth <= sectionDepth) {
      current = { heading: headingText(node), depth: node.depth, nodes: [] }
      groups.push(current)
      continue
    }

    if (!current) {
      current = { heading: '', depth: 0, nodes: [] }
      groups.push(current)
    }
    current.nodes.push(node)
  }

  return groups
}

function extractMdBasics(nodes: RootContent[], parsed: ParsedResume): void {
  const lines = nodesAsMarkdown(nodes)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 第一行无冒号可能是名字
    if (i === 0 && !line.includes(':') && !line.includes('：') && line.length <= 20) {
      parsed.name = line
      continue
    }

    // 键值对
    const kvMatch = line.match(/^[-·•]?\s*(.+?)\s*[：:]\s*(.+)$/)
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase()
      const value = kvMatch[2].trim()

      if (['姓名', 'name'].includes(key)) { parsed.name = value; continue }
      if (['职位', 'title', '岗位', '求职意向'].includes(key)) { parsed.contacts.push({ type: 'title', value }); continue }
      if (['邮箱', 'email'].includes(key)) { parsed.contacts.push({ type: 'email', value }); continue }
      if (['电话', '手机', 'phone', 'tel'].includes(key)) { parsed.contacts.push({ type: 'phone', value }); continue }
      if (['地点', '城市', 'location', '地址'].includes(key)) { parsed.contacts.push({ type: 'location', value }); continue }
      if (['网站', 'website', 'blog', '博客'].includes(key)) { parsed.contacts.push({ type: 'website', value }); continue }
      if (['github'].includes(key)) { parsed.contacts.push({ type: 'github', value }); continue }
      if (['简介', 'summary'].includes(key)) { summaryLines.push(value); continue }
    }

    // 自动从文本中提取联系方式
    extractContactsFromText(line, parsed.contacts)

    // 剩余较长行作为简介
    if (line.length > 15 && !extractEmail(line) && !extractPhone(line) && !extractUrl(line)) {
      summaryLines.push(line.replace(/^[-·•]\s*/, ''))
    }
  }

  if (summaryLines.length > 0) {
    parsed.summary = summaryLines.join('\n')
  }
}

/**
 * 从一组 Markdown AST 节点中提取条目。
 * 子 heading（h2/h3/h4 等）作为条目标题的分隔符。
 */
function extractMdEntries(
  nodes: RootContent[],
  sectionType: SectionType | null,
  subHeadingDepth: number,
): ParsedEntry[] {
  const entries: ParsedEntry[] = []

  // 技能类：全部合并成一个富文本条目
  if (sectionType === 'skills') {
    const md = nodesAsMarkdown(nodes)
    if (md.trim()) {
      entries.push({
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        location: '',
        descriptionHtml: markdownToRichTextHtml(md),
      })
    }
    return entries
  }

  let current: ParsedEntry | null = null
  let descNodes: RootContent[] = []

  function flush(): void {
    if (!current) return
    const md = nodesAsMarkdown(descNodes)
    current.descriptionHtml = markdownToRichTextHtml(md)
    if (current.title || current.subtitle || current.descriptionHtml) {
      entries.push(current)
    }
    current = null
    descNodes = []
  }

  for (const node of nodes) {
    // 遇到子标题 → 新条目
    if (node.type === 'heading' && node.depth >= subHeadingDepth) {
      flush()
      const text = headingText(node)
      const { startDate, endDate, remaining } = extractDateRange(text)
      current = {
        title: remaining || text,
        subtitle: '',
        startDate,
        endDate,
        location: '',
        descriptionHtml: '',
      }
      continue
    }

    // 段落中如果包含 | 分隔符，可能是 "标题 | 副标题 | 时间" 格式
    if (node.type === 'paragraph' && !current) {
      const text = toString(node).trim()
      if (text.includes('|')) {
        flush()
        const parts = text.split('|').map((p) => p.trim())
        const { startDate, endDate } = extractDateRange(text)
        current = {
          title: parts[0] ?? '',
          subtitle: parts.length > 2 ? parts[1] : '',
          startDate,
          endDate,
          location: '',
          descriptionHtml: '',
        }
        continue
      }
    }

    // 未遇到条目标题前，创建一个无标题条目
    if (!current) {
      current = {
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        location: '',
        descriptionHtml: '',
      }
    }

    descNodes.push(node)
  }

  flush()
  return entries
}

export function parseMarkdownToResume(markdown: string, existingTitles: string[]): ResumeDocument {
  const root = unified().use(remarkParse).parse(markdown) as Root
  const parsed: ParsedResume = { name: '', contacts: [], summary: '', sections: [] }
  const groups = splitMarkdownIntoGroups(root)

  // 检测子 heading 层级
  const headings = root.children.filter((n): n is Heading => n.type === 'heading')
  const h1Count = headings.filter((h) => h.depth === 1).length
  const sectionDepth = h1Count >= 2 ? 1 : 2
  const subHeadingDepth = sectionDepth + 1

  for (const group of groups) {
    const normalizedType = normalizeSectionHeading(group.heading)

    // 第一个组（无标题或 "个人信息"）→ 基础信息
    if (
      !group.heading ||
      group.heading === '个人信息' ||
      group.heading.toLowerCase() === 'basics' ||
      group.heading === '基本信息'
    ) {
      extractMdBasics(group.nodes, parsed)
      continue
    }

    const entries = extractMdEntries(group.nodes, normalizedType, subHeadingDepth)

    parsed.sections.push({
      heading: group.heading,
      type: normalizedType,
      entries,
    })
  }

  return parsedResumeToDocument(parsed, existingTitles)
}

// ─── PDF 纯文本解析 ────────────────────────────────────────

function normalizePdfLines(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function looksLikeName(line: string): boolean {
  return (
    !/\d|@|https?:\/\/|求职意向|教育|工作|实习|项目|技能|评价|经历|背景/i.test(line) &&
    line.length >= 2 &&
    line.length <= 20
  )
}

export function parsePdfTextToResume(text: string, existingTitles: string[]): ResumeDocument {
  const lines = normalizePdfLines(text)
  const parsed: ParsedResume = { name: '', contacts: [], summary: '', sections: [] }

  if (lines.length === 0) {
    return parsedResumeToDocument(parsed, existingTitles)
  }

  let cursor = 0

  // 1. 提取名字
  if (looksLikeName(lines[cursor])) {
    parsed.name = lines[cursor]
    cursor++
  }

  // 2. 提取基础信息（到第一个章节标题前）
  const summaryLines: string[] = []

  while (cursor < lines.length) {
    const line = lines[cursor]
    if (looksLikeSectionHeading(line.replace(/[：:]/g, ''))) break

    extractContactsFromText(line, parsed.contacts)

    // 求职意向
    const titleMatch = line.match(/求职意向[：:]?\s*(.+)$/)
    if (titleMatch?.[1]) {
      parsed.contacts.push({ type: 'title', value: cleanText(titleMatch[1]) })
      cursor++
      continue
    }

    // 既不是联系方式也不是 URL 的行，作为简介
    if (
      line.length > 8 &&
      !extractEmail(line) && !extractPhone(line) && !extractUrl(line) &&
      !/省|市|区|县/.test(line)
    ) {
      summaryLines.push(line)
    }

    cursor++
  }

  parsed.summary = summaryLines.join(' ')

  // 3. 解析章节
  let currentSection: ParsedSection | null = null
  let currentEntry: ParsedEntry | null = null
  let entryDescLines: string[] = []

  function flushEntry(): void {
    if (!currentEntry || !currentSection) return
    currentEntry.descriptionHtml = entryDescLines.length > 0
      ? plainTextToRichTextHtml(entryDescLines.join('\n'))
      : ''
    if (currentEntry.title || currentEntry.subtitle || currentEntry.descriptionHtml) {
      currentSection.entries.push(currentEntry)
    }
    currentEntry = null
    entryDescLines = []
  }

  function flushSection(): void {
    flushEntry()
    if (currentSection && (currentSection.entries.length > 0 || currentSection.heading)) {
      parsed.sections.push(currentSection)
    }
    currentSection = null
  }

  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor]
    const cleanedLine = line.replace(/[：:]/g, '').trim()

    // 检测章节标题
    if (looksLikeSectionHeading(cleanedLine)) {
      flushSection()
      currentSection = {
        heading: cleanedLine,
        type: normalizeSectionHeading(cleanedLine),
        entries: [],
      }
      continue
    }

    if (!currentSection) continue

    // 技能类章节：所有行合并成一个条目
    if (currentSection.type === 'skills') {
      if (currentSection.entries.length === 0) {
        currentSection.entries.push({
          title: '',
          subtitle: '',
          startDate: '',
          endDate: '',
          location: '',
          descriptionHtml: '',
        })
      }
      const entry = currentSection.entries[0]
      const bullet = line.replace(/^[•·●▪■\-]\s*/, '').trim()
      const prefix = /^[•·●▪■\-]/.test(line) ? '- ' : ''
      entry.descriptionHtml += (entry.descriptionHtml ? '\n' : '') + prefix + bullet
      continue
    }

    // 检测是否是条目标题行（含日期 或 含分隔符且行较短）
    const hasDate = DATE_RANGE_PATTERN.test(line)
    const hasMultiSegments = line.split(/[|·•]/).filter(Boolean).length >= 2

    if (hasDate || (hasMultiSegments && line.length <= 80)) {
      flushEntry()
      const { startDate, endDate, remaining } = extractDateRange(line)
      const parts = remaining.split(/[|·•]/).map((p) => cleanText(p)).filter(Boolean)

      currentEntry = {
        title: parts[0] ?? '',
        subtitle: parts[1] ?? '',
        startDate,
        endDate,
        location: parts[2] ?? '',
        descriptionHtml: '',
      }
      continue
    }

    // 普通内容行
    if (!currentEntry) {
      currentEntry = {
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        location: '',
        descriptionHtml: '',
      }
    }

    const normalizedBullet = line.replace(/^[•·●▪■\-]\s*/, '').trim()
    entryDescLines.push(/^[•·●▪■\-]/.test(line) ? `- ${normalizedBullet}` : line)
  }

  flushSection()

  // 技能类章节的描述转换
  for (const section of parsed.sections) {
    if (section.type === 'skills') {
      for (const entry of section.entries) {
        if (entry.descriptionHtml && !entry.descriptionHtml.startsWith('<')) {
          entry.descriptionHtml = markdownToRichTextHtml(entry.descriptionHtml)
        }
      }
    }
  }

  return parsedResumeToDocument(parsed, existingTitles)
}
