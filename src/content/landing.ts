export interface LandingFeature {
  title: string
  description: string
  icon: 'shield' | 'bolt' | 'import' | 'preview' | 'layout' | 'download'
}

export interface LandingStep {
  index: string
  title: string
  description: string
}

export interface LandingTemplateCard {
  name: string
  tone: string
  accent: string
}

export interface LandingFooterTag {
  label: string
  icon: 'storage' | 'import' | 'export'
}

export const landingFeatures: LandingFeature[] = [
  {
    title: '本地优先',
    description: '数据默认保存在浏览器本地，不依赖账户体系，也不把简历内容交给远端服务。',
    icon: 'shield',
  },
  {
    title: '免登录',
    description: '打开网页就能开始编辑，不需要注册、验证邮箱或切换复杂工作流。',
    icon: 'bolt',
  },
  {
    title: '导入旧简历',
    description: '支持导入 PDF、HTML、Markdown 和 JSON，把旧内容快速整理成结构化简历。',
    icon: 'import',
  },
  {
    title: '实时预览',
    description: '左侧编辑，右侧 A4 实时预览，始终知道导出后会长什么样。',
    icon: 'preview',
  },
  {
    title: '模板切换',
    description: '在极简、现代、侧栏和蓝线模板间切换，不需要重复整理内容。',
    icon: 'layout',
  },
  {
    title: 'PDF 导出',
    description: '保留稳定的浏览器打印导出链路，适合投递、保存和快速分享。',
    icon: 'download',
  },
]

export const landingSteps: LandingStep[] = [
  {
    index: '01',
    title: '进入工作台',
    description: '点击开始后直接进入编辑器，先写基础信息，再逐步完善模块内容。',
  },
  {
    index: '02',
    title: '导入或重写',
    description: '可以从零开始，也可以把现有 PDF、HTML 或 Markdown 简历导入进来继续整理。',
  },
  {
    index: '03',
    title: '切模板并导出',
    description: '边改边看排版效果，确认后直接导出 PDF 或工程文件。',
  },
]

export const landingTemplateCards: LandingTemplateCard[] = [
  {
    name: 'Minimal',
    tone: '留白克制',
    accent: 'neutral',
  },
  {
    name: 'Modern',
    tone: '现代清晰',
    accent: 'soft',
  },
  {
    name: 'Classic Blue',
    tone: '正式稳妥',
    accent: 'line',
  },
]

export const landingFooterTags: LandingFooterTag[] = [
  {
    label: '本地保存',
    icon: 'storage',
  },
  {
    label: '导入旧简历',
    icon: 'import',
  },
  {
    label: '导出 PDF',
    icon: 'export',
  },
]
