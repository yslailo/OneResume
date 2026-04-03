import type { ResumeTemplateId } from '@/domain/types'

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId
  label: string
  description: string
  previewTone: 'minimal' | 'modern' | 'professional' | 'sidebar' | 'blue'
}

export const resumeTemplates: ResumeTemplateDefinition[] = [
  {
    id: 'minimal',
    label: '极简',
    description: '留白克制的单栏布局，适合大多数岗位。',
    previewTone: 'minimal',
  },
  {
    id: 'modern',
    label: '现代',
    description: '强调标题与摘要节奏，适合互联网与产品岗位。',
    previewTone: 'modern',
  },
  {
    id: 'professional',
    label: '专业',
    description: '卡片式分区布局，正式稳健，适合通用投递。',
    previewTone: 'professional',
  },
  {
    id: 'clean',
    label: '清爽',
    description: '细线分组结构清晰，适合信息层级明确的履历。',
    previewTone: 'minimal',
  },
  {
    id: 'compact',
    label: '紧凑',
    description: '高密度双栏布局，适合一页内信息较多。',
    previewTone: 'minimal',
  },
  {
    id: 'elegant',
    label: '优雅',
    description: '居中报头与衬线气质，更适合设计与品牌方向。',
    previewTone: 'professional',
  },
  {
    id: 'executive',
    label: '高管',
    description: '强化头部与侧栏信息，适合资深与管理岗位。',
    previewTone: 'professional',
  },
  {
    id: 'ats',
    label: 'ATS',
    description: '极简纯净的文本导向布局，兼顾机器解析。',
    previewTone: 'minimal',
  },
  {
    id: 'classic-sidebar',
    label: '侧栏',
    description: '左右分栏结构，适合项目与技能内容较多。',
    previewTone: 'sidebar',
  },
  {
    id: 'classic-blue',
    label: '蓝线',
    description: '正式蓝线版式，适合传统岗位与稳重风格。',
    previewTone: 'blue',
  },
]

export function findResumeTemplate(templateId: ResumeTemplateId): ResumeTemplateDefinition {
  return resumeTemplates.find((template) => template.id === templateId) ?? resumeTemplates[0]
}

export function isResumeTemplateId(value: unknown): value is ResumeTemplateId {
  return typeof value === 'string' && resumeTemplates.some((template) => template.id === value)
}
