import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import {
  createDefaultSection,
  createEmptyItem,
  createEmptyResume,
  createExampleResume,
  createUniqueTitle,
  moveSectionOrder,
  sectionLabelForType,
  sortSectionsByOrder,
  touchResume,
} from '@/domain/resume'
import type {
  ResumeDocument,
  ResumeExportFile,
  ResumeItem,
  ResumePreviewMode,
  ResumeStyle,
  ResumeTemplateId,
  SectionType,
  WorkspaceIndex,
} from '@/domain/types'
import { clearAssets, deletePhotoAsset, getPhotoAsset, savePhotoAsset } from '@/persistence/assetsRepository'
import { renderResumeIntoHtmlTemplate } from '@/persistence/htmlTemplateSync'
import { exportResumeToJson, importResumeFromJson } from '@/persistence/jsonExchange'
import { exportResumeToMarkdown, importResumeFromMarkdown } from '@/persistence/markdownExchange'
import { importResumeFromPdf } from '@/persistence/pdfExchange'
import {
  clearWorkspaceStorage,
  deleteResume,
  loadResume,
  loadWorkspaceIndex,
  saveResume,
  saveWorkspaceIndex,
} from '@/persistence/workspaceRepository'
import { downloadTextFile, sanitizeFileName } from '@/utils/files'
import { cropImageToStandardPhoto, dataUrlToPhotoAsset } from '@/utils/images'
import { downloadMarkdownPackage, extensionFromMimeType } from '@/utils/markdownPackageExport'

type MobilePane = 'editor' | 'preview'

export const useWorkspaceStore = defineStore('workspace', () => {
  const resumes = ref<ResumeDocument[]>([])
  const currentResumeId = ref('')
  const isReady = ref(false)
  const mobilePane = ref<MobilePane>('editor')
  const previewScale = ref(0.82)
  const photoUrl = ref<string | null>(null)
  const saveError = ref<string | null>(null)
  const notice = ref<string | null>(null)

  const currentResume = computed(
    () => resumes.value.find((resume) => resume.id === currentResumeId.value) ?? null,
  )
  const orderedSections = computed(() =>
    currentResume.value ? sortSectionsByOrder(currentResume.value) : [],
  )
  const hasSourceHtml = computed(() =>
    Boolean(currentResume.value?.sourceFormat === 'html' && currentResume.value.rawSourceHtml),
  )
  const sourceHtmlHasLocalImage = computed(() =>
    Boolean(
      currentResume.value?.rawSourceHtml &&
        /<img[^>]+src=["'](?:[A-Za-z]:\\|file:\/\/\/)/i.test(currentResume.value.rawSourceHtml),
    ),
  )

  function setNotice(message: string | null): void {
    notice.value = message
  }

  function createImportedTitle(fileName: string, existingTitles: string[]): string {
    const baseName = fileName.replace(/\.[^/.]+$/u, '').trim() || '未命名简历'
    return createUniqueTitle(baseName, existingTitles)
  }

  function setSaveError(error: unknown): void {
    const detail = error instanceof Error ? error.message : '未知错误'
    saveError.value = `本地保存失败：${detail}`
  }

  async function revokePhotoUrl(): Promise<void> {
    if (photoUrl.value) {
      URL.revokeObjectURL(photoUrl.value)
      photoUrl.value = null
    }
  }

  async function hydrateCurrentPhoto(): Promise<void> {
    await revokePhotoUrl()
    if (!currentResume.value?.photoAssetId) {
      return
    }

    const photo = await getPhotoAsset(currentResume.value.photoAssetId)
    if (photo) {
      photoUrl.value = URL.createObjectURL(photo.blob)
    }
  }

  function buildWorkspaceIndex(): WorkspaceIndex {
    return {
      version: 1,
      currentResumeId: currentResumeId.value,
      resumeIds: resumes.value.map((resume) => resume.id),
      lastOpenedAt: new Date().toISOString(),
    }
  }

  async function persistAll(targetResume?: ResumeDocument): Promise<void> {
    try {
      if (targetResume) {
        saveResume(targetResume)
      }
      saveWorkspaceIndex(buildWorkspaceIndex())
      saveError.value = null
    } catch (error) {
      setSaveError(error)
      throw error
    }
  }

  function replaceResume(next: ResumeDocument): void {
    const index = resumes.value.findIndex((resume) => resume.id === next.id)
    if (index >= 0) {
      resumes.value.splice(index, 1, next)
    }
  }

  async function mutateCurrent(mutator: (draft: ResumeDocument) => void): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    const draft = structuredClone(toRaw(current))
    mutator(draft)
    const next = touchResume(draft)
    replaceResume(next)
    await persistAll(next)
  }

  async function bootstrap(preferredResumeId?: string): Promise<void> {
    const workspace = loadWorkspaceIndex()

    if (!workspace || workspace.resumeIds.length === 0) {
      const initialResume = createExampleResume()
      resumes.value = [initialResume]
      currentResumeId.value = initialResume.id
      await persistAll(initialResume)
      isReady.value = true
      await hydrateCurrentPhoto()
      return
    }

    resumes.value = workspace.resumeIds
      .map((id) => loadResume(id))
      .filter((resume): resume is ResumeDocument => Boolean(resume))

    if (resumes.value.length === 0) {
      const fallback = createExampleResume()
      resumes.value = [fallback]
      currentResumeId.value = fallback.id
      await persistAll(fallback)
    } else {
      currentResumeId.value =
        preferredResumeId && resumes.value.some((resume) => resume.id === preferredResumeId)
          ? preferredResumeId
          : workspace.currentResumeId || resumes.value[0].id
      await persistAll()
    }

    isReady.value = true
    await hydrateCurrentPhoto()
  }

  async function switchResume(id: string): Promise<void> {
    if (!resumes.value.some((resume) => resume.id === id)) {
      return
    }

    currentResumeId.value = id
    await persistAll()
    await hydrateCurrentPhoto()
  }

  async function createResume(): Promise<void> {
    const title = createUniqueTitle('未命名简历', resumes.value.map((resume) => resume.title))
    const resume = createEmptyResume(title)
    resumes.value.unshift(resume)
    currentResumeId.value = resume.id
    await persistAll(resume)
    await hydrateCurrentPhoto()
    setNotice('已创建新的空白简历')
  }

  async function renameCurrentResume(title: string): Promise<void> {
    if (!title.trim()) {
      return
    }

    await mutateCurrent((draft) => {
      draft.title = title.trim()
    })
  }

  async function deleteCurrentResumeEntry(): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    if (current.photoAssetId) {
      await deletePhotoAsset(current.photoAssetId)
    }
    deleteResume(current.id)
    resumes.value = resumes.value.filter((resume) => resume.id !== current.id)

    if (resumes.value.length === 0) {
      const blank = createEmptyResume('未命名简历')
      resumes.value = [blank]
      currentResumeId.value = blank.id
      await persistAll(blank)
    } else {
      currentResumeId.value = resumes.value[0].id
      await persistAll()
    }

    await hydrateCurrentPhoto()
    setNotice('当前简历已删除')
  }

  async function resetCurrentResume(): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    if (current.photoAssetId) {
      await deletePhotoAsset(current.photoAssetId)
    }

    const blank = createEmptyResume(current.title)
    blank.id = current.id
    blank.createdAt = current.createdAt
    blank.templateId = current.templateId
    blank.style = current.style
    replaceResume(blank)
    await persistAll(blank)
    await hydrateCurrentPhoto()
    setNotice('已重置为当前模板下的空白简历')
  }

  async function updateBasicsField<K extends keyof ResumeDocument['basics']>(
    key: K,
    value: ResumeDocument['basics'][K],
  ): Promise<void> {
    await mutateCurrent((draft) => {
      draft.basics[key] = value
    })
  }

  async function updateTemplate(templateId: ResumeTemplateId): Promise<void> {
    await mutateCurrent((draft) => {
      draft.templateId = templateId
    })
  }

  async function updatePreviewMode(previewMode: ResumePreviewMode): Promise<void> {
    await mutateCurrent((draft) => {
      draft.previewMode =
        (previewMode === 'source-html' || previewMode === 'source-html-sync') &&
        draft.sourceFormat === 'html' &&
        draft.rawSourceHtml
          ? previewMode
          : 'structured'
    })
  }

  async function updateStyle(stylePatch: Partial<ResumeStyle>): Promise<void> {
    await mutateCurrent((draft) => {
      draft.style = {
        ...draft.style,
        ...stylePatch,
      }
    })
  }

  async function reorderSections(nextIds: string[]): Promise<void> {
    await mutateCurrent((draft) => {
      draft.sectionOrder = nextIds
    })
  }

  async function toggleSection(sectionId: string): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (section) {
        section.visible = !section.visible
      }
    })
  }

  async function renameSection(sectionId: string, label: string): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (section) {
        section.label = label
      }
    })
  }

  async function updateSectionType(sectionId: string, type: SectionType): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (!section || section.type === type) {
        return
      }

      const previousDefaultLabel = sectionLabelForType(section.type)
      section.type = type
      if (!section.label.trim() || section.label === previousDefaultLabel) {
        section.label = sectionLabelForType(type)
      }
    })
  }

  async function moveSectionToIndex(sectionId: string, targetIndex: number): Promise<void> {
    await mutateCurrent((draft) => {
      draft.sectionOrder = moveSectionOrder(draft.sectionOrder, sectionId, targetIndex)
    })
  }

  async function addCustomSection(): Promise<void> {
    await mutateCurrent((draft) => {
      const order = draft.sections.filter((section) => section.type === 'custom').length + 1
      const section = createDefaultSection('custom', {
        label: `自定义模块 ${order}`,
        visible: true,
        items: [
          createEmptyItem({
            title: '自定义标题',
            descriptionHtml: '<p>在这里填写自定义模块内容</p>',
          }),
        ],
      })
      draft.sections.push(section)
      draft.sectionOrder.push(section.id)
    })
    setNotice('已新增自定义模块')
  }

  async function removeSection(sectionId: string): Promise<void> {
    let removed = false
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (!section || section.type !== 'custom') {
        return
      }

      draft.sections = draft.sections.filter((entry) => entry.id !== sectionId)
      draft.sectionOrder = draft.sectionOrder.filter((id) => id !== sectionId)
      removed = true
    })
    if (removed) {
      setNotice('已删除自定义模块')
    }
  }

  async function addItem(sectionId: string): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      section?.items.push(createEmptyItem())
    })
  }

  async function updateItem(sectionId: string, itemId: string, patch: Partial<ResumeItem>): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      const item = section?.items.find((entry) => entry.id === itemId)
      if (item) {
        Object.assign(item, patch)
      }
    })
  }

  async function removeItem(sectionId: string, itemId: string): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (section) {
        section.items = section.items.filter((item) => item.id !== itemId)
      }
    })
  }

  async function reorderItems(sectionId: string, nextIds: string[]): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (!section) {
        return
      }

      const itemMap = new Map(section.items.map((item) => [item.id, item]))
      section.items = nextIds
        .map((id) => itemMap.get(id))
        .filter((item): item is ResumeItem => Boolean(item))
    })
  }

  async function replaceSectionItems(sectionId: string, items: ResumeItem[]): Promise<void> {
    await mutateCurrent((draft) => {
      const section = draft.sections.find((entry) => entry.id === sectionId)
      if (section) {
        section.items = items
      }
    })
  }

  async function exportCurrentJson(): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    const photo = current.photoAssetId ? await getPhotoAsset(current.photoAssetId) : undefined
    const payload = await exportResumeToJson(current, photo)
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${sanitizeFileName(current.title || 'resume')}.json`,
      'application/json;charset=utf-8',
    )
  }

  async function importJsonFile(file: File): Promise<void> {
    const text = await file.text()
    const payload = JSON.parse(text) as ResumeExportFile
    const imported = importResumeFromJson(payload, resumes.value.map((resume) => resume.title))
    const next = imported.resume
    next.title = createImportedTitle(file.name, resumes.value.map((resume) => resume.title))

    if (imported.photoDataUrl) {
      const photo = await dataUrlToPhotoAsset(imported.photoDataUrl)
      next.photoAssetId = photo.id
      await savePhotoAsset(photo)
    }

    resumes.value.unshift(next)
    currentResumeId.value = next.id
    await persistAll(next)
    await hydrateCurrentPhoto()
    setNotice('工程文件已导入')
  }

  async function exportCurrentMarkdownPackage(): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    const photoAsset =
      current.style.showPhoto && current.photoAssetId ? await getPhotoAsset(current.photoAssetId) : undefined
    const photoFileName = photoAsset ? `avatar.${extensionFromMimeType(photoAsset.blob.type)}` : null
    const photoMarkdownPath = photoFileName ? `images/${photoFileName}` : undefined
    const previewHtml =
      current.sourceFormat === 'html' && current.rawSourceHtml
        ? current.previewMode === 'source-html-sync'
          ? (() => {
              const document = new DOMParser().parseFromString(current.rawSourceHtml, 'text/html')
              document.body.innerHTML = renderResumeIntoHtmlTemplate(
                current.rawSourceHtml,
                current,
                photoMarkdownPath ?? null,
              )
              return document.documentElement.outerHTML
            })()
          : current.rawSourceHtml
        : null
    const markdown = exportResumeToMarkdown(current, {
      photoMarkdownPath,
      preferredHtml: previewHtml,
    })

    await downloadMarkdownPackage({
      markdown,
      images: photoAsset && photoFileName ? [{ name: photoFileName, blob: photoAsset.blob }] : [],
      extraFiles: previewHtml
        ? [
            {
              name: 'resume.html',
              content: previewHtml,
            },
          ]
        : [],
      zipFileName: `${sanitizeFileName(current.title || 'resume')}-markdown.zip`,
    })
  }

  async function exportCurrentHtml(): Promise<void> {
    const current = currentResume.value
    if (!current?.rawSourceHtml) {
      return
    }

    downloadTextFile(
      current.rawSourceHtml,
      `${sanitizeFileName(current.title || 'resume')}.html`,
      'text/html;charset=utf-8',
    )
  }

  async function importMarkdownFile(file: File): Promise<void> {
    const markdown = await file.text()
    const next = importResumeFromMarkdown(markdown, resumes.value.map((resume) => resume.title))
    next.title = createImportedTitle(file.name, resumes.value.map((resume) => resume.title))
    resumes.value.unshift(next)
    currentResumeId.value = next.id
    await persistAll(next)
    await hydrateCurrentPhoto()
    setNotice(
      next.sourceFormat === 'html'
        ? '已识别为 HTML 模板简历，并保留原样式导入'
        : 'Markdown 已导入为新简历',
    )
  }

  async function importHtmlFile(file: File): Promise<void> {
    const html = await file.text()
    const next = importResumeFromMarkdown(html, resumes.value.map((resume) => resume.title))
    next.sourceFormat = 'html'
    next.previewMode = 'source-html'
    next.rawSourceHtml = html
    next.title = createImportedTitle(file.name, resumes.value.map((resume) => resume.title))
    resumes.value.unshift(next)
    currentResumeId.value = next.id
    await persistAll(next)
    await hydrateCurrentPhoto()
    setNotice('HTML 简历已按原模板导入')
  }

  async function importPdfFile(file: File): Promise<void> {
    const imported = await importResumeFromPdf(file, resumes.value.map((resume) => resume.title))
    const next = imported.resume
    next.title = createImportedTitle(file.name, resumes.value.map((resume) => resume.title))
    resumes.value.unshift(next)
    currentResumeId.value = next.id
    await persistAll(next)
    await hydrateCurrentPhoto()
    setNotice(
      imported.strategy === 'smart-html'
        ? 'PDF 已按版式特征智能导入，建议检查并微调模块内容'
        : 'PDF 已导入为可编辑简历，建议检查并微调模块内容',
    )
  }

  async function importResumeFile(file: File): Promise<void> {
    const lowerName = file.name.toLowerCase()

    if (lowerName.endsWith('.json')) {
      await importJsonFile(file)
      return
    }

    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
      await importHtmlFile(file)
      return
    }

    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      await importPdfFile(file)
      return
    }

    if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.txt')) {
      await importMarkdownFile(file)
      return
    }

    throw new Error('暂不支持该文件格式，请导入 PDF、HTML、Markdown、TXT 或工程文件')
  }

  async function setPhoto(file: File): Promise<void> {
    const current = currentResume.value
    if (!current) {
      return
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('请选择 JPG、PNG 或 WebP 图片文件')
    }

    const asset = await cropImageToStandardPhoto(file)
    const previousPhotoId = current.photoAssetId
    await savePhotoAsset(asset)
    await mutateCurrent((draft) => {
      draft.photoAssetId = asset.id
      draft.style.showPhoto = true
    })
    if (previousPhotoId) {
      await deletePhotoAsset(previousPhotoId)
    }
    await hydrateCurrentPhoto()
    setNotice('头像已更新')
  }

  async function removePhoto(): Promise<void> {
    const current = currentResume.value
    if (!current?.photoAssetId) {
      return
    }

    const oldPhotoId = current.photoAssetId
    await mutateCurrent((draft) => {
      draft.photoAssetId = null
      draft.style.showPhoto = false
    })
    await deletePhotoAsset(oldPhotoId)
    await hydrateCurrentPhoto()
  }

  async function clearAllLocalData(): Promise<void> {
    clearWorkspaceStorage()
    await clearAssets()
    resumes.value = []
    currentResumeId.value = ''
    await revokePhotoUrl()
    await bootstrap()
    setNotice('已清空本地数据，并重新创建示例简历')
  }

  function setPreviewScale(scale: number): void {
    previewScale.value = scale
  }

  function setMobilePane(value: MobilePane): void {
    mobilePane.value = value
  }

  return {
    resumes,
    currentResumeId,
    isReady,
    mobilePane,
    previewScale,
    photoUrl,
    saveError,
    notice,
    currentResume,
    orderedSections,
    hasSourceHtml,
    sourceHtmlHasLocalImage,
    bootstrap,
    switchResume,
    createResume,
    renameCurrentResume,
    deleteCurrentResumeEntry,
    resetCurrentResume,
    updateBasicsField,
    updateTemplate,
    updatePreviewMode,
    updateStyle,
    reorderSections,
    moveSectionToIndex,
    toggleSection,
    renameSection,
    updateSectionType,
    addCustomSection,
    removeSection,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    replaceSectionItems,
    exportCurrentJson,
    importJsonFile,
    exportCurrentMarkdownPackage,
    exportCurrentHtml,
    importMarkdownFile,
    importPdfFile,
    importResumeFile,
    setPhoto,
    removePhoto,
    clearAllLocalData,
    setPreviewScale,
    setMobilePane,
    setNotice,
  }
})
