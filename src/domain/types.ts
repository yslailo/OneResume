export const RESUME_SCHEMA_VERSION = 1

export type ResumeTemplateId = 'minimal' | 'modern' | 'classic-sidebar'
export type FontFamilyOption = 'sans' | 'serif'
export type PhotoPlacement = 'left' | 'right'
export type SectionType = 'education' | 'work' | 'project' | 'skills' | 'custom'
export type ResumeSourceFormat = 'structured' | 'html'
export type ResumePreviewMode = 'structured' | 'source-html' | 'source-html-sync'

export interface WorkspaceIndex {
  version: number
  currentResumeId: string
  resumeIds: string[]
  lastOpenedAt: string
}

export interface ResumeStyle {
  accentColor: string
  fontFamily: FontFamilyOption
  baseFontSize: number
  lineHeight: number
  pageMargin: number
  sectionGap: number
  showPhoto: boolean
  photoPlacement: PhotoPlacement
}

export interface BasicsSection {
  name: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  github: string
  summary: string
}

export interface ResumeItem {
  id: string
  title: string
  subtitle: string
  startDate: string
  endDate: string
  location: string
  descriptionMarkdown: string
  highlights: string[]
}

export interface ResumeSection {
  id: string
  type: SectionType
  label: string
  visible: boolean
  items: ResumeItem[]
}

export interface ResumeDocument {
  id: string
  version: number
  title: string
  templateId: ResumeTemplateId
  sourceFormat: ResumeSourceFormat
  previewMode: ResumePreviewMode
  rawSourceHtml: string | null
  style: ResumeStyle
  basics: BasicsSection
  sectionOrder: string[]
  sections: ResumeSection[]
  photoAssetId: string | null
  createdAt: string
  updatedAt: string
}

export interface StoredPhotoAsset {
  id: string
  blob: Blob
  createdAt: string
  width: number
  height: number
}

export interface ResumeExportFile {
  version: number
  resume: ResumeDocument
  assetsMeta: {
    hasPhoto: boolean
    photoContentType?: string
  }
  photoDataUrl?: string
}
