import type {
  BasicsSection,
  ResumeDocument,
  ResumeItem,
  ResumeSection,
  ResumeStyle,
  ResumeTemplateId,
  SectionType,
} from '@/domain/types'
import { RESUME_SCHEMA_VERSION, RESUME_TEMPLATE_IDS } from '@/domain/types'
import { markdownToRichTextHtml, plainTextToRichTextHtml } from '@/utils/richTextContent'

const SECTION_LABELS: Record<SectionType, string> = {
  education: '教育背景',
  work: '工作经历',
  project: '项目经历',
  skills: '专业技能',
  custom: '自定义模块',
}

const DEFAULT_TEMPLATE_ID: ResumeTemplateId = 'minimal'
const VALID_TEMPLATE_IDS = new Set<ResumeTemplateId>(RESUME_TEMPLATE_IDS)

export function createId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createDefaultStyle(): ResumeStyle {
  return {
    accentColor: '#0f766e',
    fontFamily: 'alibaba',
    baseFontSize: 14,
    sectionTitleSize: 18,
    itemTitleSize: 16,
    lineHeight: 1.65,
    pageMargin: 20,
    sectionGap: 18,
    paragraphGap: 8,
    showSectionIcons: false,
    centerSubtitle: false,
    stackItemMeta: false,
    showPhoto: true,
    photoPlacement: 'right',
  }
}

function normalizeNumberStyleValue(
  value: unknown,
  fallback: number,
  min?: number,
  max?: number,
): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  const boundedMin = typeof min === 'number' ? Math.max(parsed, min) : parsed
  return typeof max === 'number' ? Math.min(boundedMin, max) : boundedMin
}

export function normalizeResumeStyle(input: Partial<ResumeStyle> | undefined): ResumeStyle {
  const defaults = createDefaultStyle()
  const style = input ?? {}

  return {
    ...defaults,
    ...style,
    accentColor:
      typeof style.accentColor === 'string' && style.accentColor.trim() ? style.accentColor : defaults.accentColor,
    fontFamily:
      style.fontFamily === 'source-serif'
        ? 'source-serif'
        : style.fontFamily === 'mi-sans'
          ? 'mi-sans'
          : style.fontFamily === 'ibm-plex'
            ? 'ibm-plex'
            : style.fontFamily === 'alibaba'
              ? 'alibaba'
              : style.fontFamily === 'serif'
                ? 'source-serif'
                : defaults.fontFamily,
    baseFontSize: normalizeNumberStyleValue(style.baseFontSize, defaults.baseFontSize, 10, 24),
    sectionTitleSize: normalizeNumberStyleValue(style.sectionTitleSize, defaults.sectionTitleSize, 12, 30),
    itemTitleSize: normalizeNumberStyleValue(style.itemTitleSize, defaults.itemTitleSize, 12, 26),
    lineHeight: normalizeNumberStyleValue(style.lineHeight, defaults.lineHeight, 1.1, 2.4),
    pageMargin: normalizeNumberStyleValue(style.pageMargin, defaults.pageMargin, 0, 50),
    sectionGap: normalizeNumberStyleValue(style.sectionGap, defaults.sectionGap, 0, 48),
    paragraphGap: normalizeNumberStyleValue(style.paragraphGap, defaults.paragraphGap, 0, 24),
    showSectionIcons: typeof style.showSectionIcons === 'boolean' ? style.showSectionIcons : defaults.showSectionIcons,
    centerSubtitle: typeof style.centerSubtitle === 'boolean' ? style.centerSubtitle : defaults.centerSubtitle,
    stackItemMeta: typeof style.stackItemMeta === 'boolean' ? style.stackItemMeta : defaults.stackItemMeta,
    showPhoto: typeof style.showPhoto === 'boolean' ? style.showPhoto : defaults.showPhoto,
    photoPlacement: style.photoPlacement === 'left' ? 'left' : defaults.photoPlacement,
  }
}

export function createEmptyBasics(): BasicsSection {
  return {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    github: '',
    summaryHtml: '',
  }
}

export function createEmptyItem(overrides: Partial<ResumeItem> = {}): ResumeItem {
  return {
    id: createId('item'),
    title: '',
    subtitle: '',
    startDate: '',
    endDate: '',
    location: '',
    descriptionHtml: '',
    highlights: [],
    ...overrides,
  }
}

export function createDefaultSection(type: SectionType, overrides: Partial<ResumeSection> = {}): ResumeSection {
  return {
    id: createId(`section-${type}`),
    type,
    label: SECTION_LABELS[type],
    visible: true,
    items: [],
    ...overrides,
  }
}

export function createDefaultSections(): ResumeSection[] {
  return [
    createDefaultSection('education'),
    createDefaultSection('work'),
    createDefaultSection('project'),
    createDefaultSection('skills'),
    createDefaultSection('custom', { visible: false, label: '附加信息' }),
  ]
}

export function createEmptyResume(title = '未命名简历'): ResumeDocument {
  const now = new Date().toISOString()
  const sections = createDefaultSections()

  return {
    id: createId('resume'),
    version: RESUME_SCHEMA_VERSION,
    title,
    templateId: DEFAULT_TEMPLATE_ID,
    sourceFormat: 'structured',
    previewMode: 'structured',
    rawSourceHtml: null,
    style: createDefaultStyle(),
    basics: createEmptyBasics(),
    sectionOrder: sections.map((section) => section.id),
    sections,
    photoAssetId: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function createExampleResume(): ResumeDocument {
  const resume = createEmptyResume('产品设计工程师')

  resume.basics = {
    name: '林若川',
    title: '前端工程师 / 简历体验设计爱好者',
    email: 'ruochuan@example.com',
    phone: '138-0000-0000',
    location: '上海',
    website: 'https://portfolio.example.com',
    github: 'https://github.com/example',
    summaryHtml: plainTextToRichTextHtml(
      '专注于信息密集型产品与编辑体验设计，擅长把复杂流程压缩成清晰、高效、可维护的交互。近年持续投入在本地优先、可打印文档和性能优化方向。',
    ),
  }

  const education = resume.sections.find((section) => section.type === 'education')
  const work = resume.sections.find((section) => section.type === 'work')
  const project = resume.sections.find((section) => section.type === 'project')
  const skills = resume.sections.find((section) => section.type === 'skills')
  const custom = resume.sections.find((section) => section.type === 'custom')

  if (education) {
    education.items = [
      createEmptyItem({
        title: '同济大学',
        subtitle: '软件工程 · 本科',
        startDate: '2016.09',
        endDate: '2020.06',
        location: '上海',
        descriptionHtml: markdownToRichTextHtml('- 主修软件工程、交互设计与信息可视化\n- 连续两年获得校级奖学金'),
      }),
    ]
  }

  if (work) {
    work.items = [
      createEmptyItem({
        title: '云帆科技',
        subtitle: '高级前端工程师',
        startDate: '2022.03',
        endDate: '至今',
        location: '上海',
        descriptionHtml: markdownToRichTextHtml(
          '- 负责在线文档与表单工作台的架构设计，首屏渲染时间降低 **34%**\n- 主导本地优先缓存方案，离线编辑稳定性显著提升\n- 设计打印视图系统，支持 PDF 导出与 A4 精确预览',
        ),
      }),
      createEmptyItem({
        title: '北景互动',
        subtitle: '前端工程师',
        startDate: '2020.07',
        endDate: '2022.02',
        location: '杭州',
        descriptionHtml: markdownToRichTextHtml(
          '- 参与企业级中后台系统重构，统一组件规范与样式变量\n- 推动文档编辑器在多个业务线复用',
        ),
      }),
    ]
  }

  if (project) {
    project.items = [
      createEmptyItem({
        title: 'OneResume 本地优先简历编辑器',
        subtitle: '个人项目',
        startDate: '2026.03',
        endDate: '进行中',
        location: '远程',
        descriptionHtml: markdownToRichTextHtml(
          '- 以 `Vue 3 + Pinia + Tailwind` 构建纯前端简历生成器\n- 实现 JSON 工程导入导出、Markdown 兼容导入与打印导出闭环\n- 模板层与数据层分离，支持多模板无缝切换',
        ),
      }),
    ]
  }

  if (skills) {
    skills.items = [
      createEmptyItem({
        title: '前端技术栈',
        subtitle: 'Vue / TypeScript / Vite / Tailwind',
        descriptionHtml: markdownToRichTextHtml('- 熟悉组件设计、状态管理、打印样式与性能优化'),
      }),
      createEmptyItem({
        title: '产品能力',
        subtitle: '信息架构 / 交互设计 / 文档体验',
        descriptionHtml: markdownToRichTextHtml('- 擅长将复杂操作压缩为低心智负担的工作流'),
      }),
    ]
  }

  if (custom) {
    custom.visible = true
    custom.label = '附加信息'
    custom.items = [
      createEmptyItem({
        title: '语言能力',
        subtitle: '中文 / 英文',
        descriptionHtml: markdownToRichTextHtml('- 英文可作为工作语言\n- 可独立撰写中英文简历与项目材料'),
      }),
    ]
  }

  return touchResume(resume)
}

export function touchResume(resume: ResumeDocument): ResumeDocument {
  return {
    ...resume,
    updatedAt: new Date().toISOString(),
  }
}

export function sortSectionsByOrder(resume: ResumeDocument): ResumeSection[] {
  const map = new Map(resume.sections.map((section) => [section.id, section]))
  return resume.sectionOrder.map((id) => map.get(id)).filter(Boolean) as ResumeSection[]
}

export function ensureSectionOrder(sections: ResumeSection[], sectionOrder?: string[]): string[] {
  const ids = sections.map((section) => section.id)
  const preferred = sectionOrder?.filter((id) => ids.includes(id)) ?? []
  const missing = ids.filter((id) => !preferred.includes(id))
  return [...preferred, ...missing]
}

export function moveSectionOrder(sectionOrder: string[], sectionId: string, targetIndex: number): string[] {
  const currentIndex = sectionOrder.indexOf(sectionId)
  if (currentIndex === -1) {
    return sectionOrder
  }

  const boundedTargetIndex = Math.max(0, Math.min(targetIndex, sectionOrder.length - 1))
  if (boundedTargetIndex === currentIndex) {
    return sectionOrder
  }

  const next = [...sectionOrder]
  next.splice(currentIndex, 1)
  next.splice(boundedTargetIndex, 0, sectionId)
  return next
}

function isSectionType(value: unknown): value is SectionType {
  return typeof value === 'string' && ['education', 'work', 'project', 'skills', 'custom'].includes(value)
}

type LegacyBasicsSection = BasicsSection & {
  summary?: string
}

type LegacyResumeItem = ResumeItem & {
  descriptionMarkdown?: string
}

function migrateBasics(input: Partial<LegacyBasicsSection> | undefined): BasicsSection {
  const basicsInput = input ?? {}

  return {
    ...createEmptyBasics(),
    ...basicsInput,
    summaryHtml:
      typeof basicsInput.summaryHtml === 'string'
        ? basicsInput.summaryHtml
        : typeof basicsInput.summary === 'string'
          ? markdownToRichTextHtml(basicsInput.summary)
          : '',
  }
}

function migrateItem(item: Partial<LegacyResumeItem>): ResumeItem {
  return createEmptyItem({
    ...item,
    id: typeof item.id === 'string' ? item.id : createId('item'),
    title: typeof item.title === 'string' ? item.title : '',
    subtitle: typeof item.subtitle === 'string' ? item.subtitle : '',
    startDate: typeof item.startDate === 'string' ? item.startDate : '',
    endDate: typeof item.endDate === 'string' ? item.endDate : '',
    location: typeof item.location === 'string' ? item.location : '',
    descriptionHtml:
      typeof item.descriptionHtml === 'string'
        ? item.descriptionHtml
        : typeof item.descriptionMarkdown === 'string'
          ? markdownToRichTextHtml(item.descriptionMarkdown)
          : '',
    highlights: Array.isArray(item.highlights)
      ? item.highlights.filter((entry): entry is string => typeof entry === 'string')
      : [],
  })
}

export function migrateResumeDocument(input: Partial<ResumeDocument>): ResumeDocument {
  const fallback = createEmptyResume(typeof input.title === 'string' ? input.title : '导入简历')
  const sectionsInput = Array.isArray(input.sections) ? input.sections : fallback.sections

  const sections = sectionsInput.map((sectionLike) => {
    const type = isSectionType(sectionLike.type) ? sectionLike.type : 'custom'
    const defaultSection = createDefaultSection(type)
    const items = Array.isArray(sectionLike.items) ? sectionLike.items.map((item) => migrateItem(item as LegacyResumeItem)) : []

    return {
      ...defaultSection,
      ...sectionLike,
      id: typeof sectionLike.id === 'string' ? sectionLike.id : defaultSection.id,
      type,
      label: typeof sectionLike.label === 'string' ? sectionLike.label : defaultSection.label,
      visible: typeof sectionLike.visible === 'boolean' ? sectionLike.visible : true,
      items,
    }
  })

  return {
    ...fallback,
    ...input,
    id: typeof input.id === 'string' ? input.id : fallback.id,
    version: RESUME_SCHEMA_VERSION,
    templateId:
      typeof input.templateId === 'string' && VALID_TEMPLATE_IDS.has(input.templateId as ResumeTemplateId)
        ? (input.templateId as ResumeTemplateId)
        : fallback.templateId,
    sourceFormat: input.sourceFormat === 'html' ? 'html' : 'structured',
    previewMode:
      (input.previewMode === 'source-html' || input.previewMode === 'source-html-sync') && input.sourceFormat === 'html'
        ? input.previewMode
        : 'structured',
    rawSourceHtml: typeof input.rawSourceHtml === 'string' ? input.rawSourceHtml : null,
    style: normalizeResumeStyle(input.style),
    basics: migrateBasics(input.basics as Partial<LegacyBasicsSection>),
    sections,
    sectionOrder: ensureSectionOrder(sections, input.sectionOrder),
    photoAssetId: typeof input.photoAssetId === 'string' ? input.photoAssetId : null,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : fallback.createdAt,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : fallback.updatedAt,
  }
}

export function createImportedResume(imported: Partial<ResumeDocument>, existingTitles: string[]): ResumeDocument {
  const migrated = migrateResumeDocument(imported)
  const now = new Date().toISOString()
  const uniqueTitle = createUniqueTitle(migrated.title, existingTitles)

  return {
    ...migrated,
    id: createId('resume'),
    title: uniqueTitle,
    createdAt: now,
    updatedAt: now,
  }
}

export function createUniqueTitle(title: string, existingTitles: string[]): string {
  if (!existingTitles.includes(title)) {
    return title
  }

  let counter = 2
  while (existingTitles.includes(`${title} (${counter})`)) {
    counter += 1
  }

  return `${title} (${counter})`
}

export function sectionLabelForType(type: SectionType): string {
  return SECTION_LABELS[type]
}

export function normalizeSectionHeading(heading: string): SectionType | null {
  const normalized = heading.trim().toLowerCase()
  const mapping: Record<string, SectionType> = {
    basics: 'custom',
    'basic info': 'custom',
    个人信息: 'custom',
    教育背景: 'education',
    education: 'education',
    工作经历: 'work',
    实习经历: 'work',
    实习经验: 'work',
    experience: 'work',
    work: 'work',
    项目经历: 'project',
    项目经验: 'project',
    projects: 'project',
    project: 'project',
    专业技能: 'skills',
    技能特长: 'skills',
    skills: 'skills',
    自定义模块: 'custom',
    附加信息: 'custom',
    custom: 'custom',
  }

  return mapping[normalized] ?? null
}
