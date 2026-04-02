<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ResumeEditor from '@/components/ResumeEditor.vue'
import ResumePreviewPane from '@/components/ResumePreviewPane.vue'
import ResumeToolbar from '@/components/ResumeToolbar.vue'
import { useWorkspaceStore } from '@/stores/workspace'

type ExportFormat = 'pdf' | 'json' | 'html'

const router = useRouter()
const workspace = useWorkspaceStore()
const photoInputRef = ref<HTMLInputElement | null>(null)

const resumeOptions = computed(() =>
  workspace.resumes.map((resume) => ({
    id: resume.id,
    title: resume.title,
  })),
)

onMounted(async () => {
  if (!workspace.isReady) {
    await workspace.bootstrap()
  }
})

async function deleteCurrentResume(): Promise<void> {
  if (!workspace.currentResume) {
    return
  }

  if (window.confirm(`确定删除「${workspace.currentResume.title}」吗？此操作只影响当前浏览器本地数据。`)) {
    await workspace.deleteCurrentResumeEntry()
  }
}

async function resetCurrentResume(): Promise<void> {
  if (!workspace.currentResume) {
    return
  }

  if (window.confirm('确定将当前简历重置为空白内容吗？模板和样式会保留。')) {
    await workspace.resetCurrentResume()
  }
}

async function clearAllLocalData(): Promise<void> {
  if (window.confirm('这会清空当前浏览器中的全部本地简历数据，确定继续吗？')) {
    await workspace.clearAllLocalData()
  }
}

function openPrintView(): void {
  if (!workspace.currentResume) {
    return
  }

  const url = router.resolve({
    name: 'print',
    params: { resumeId: workspace.currentResume.id },
    query: { autoprint: '1' },
  }).href

  window.open(url, '_blank', 'noopener,noreferrer')
}

function openPhotoPicker(): void {
  photoInputRef.value?.click()
}

async function syncStructuredPreview(): Promise<void> {
  await workspace.updatePreviewMode('source-html-sync')
  workspace.setNotice('已切换到上传模板同步预览，右侧会按你的 HTML 模板实时更新。')
}

async function handlePhotoFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    try {
      await workspace.setPhoto(file)
    } catch (error) {
      const message = error instanceof Error ? error.message : '头像上传失败'
      workspace.setNotice(message)
    }
  }
  input.value = ''
}

async function handleImportFile(file: File): Promise<void> {
  try {
    await workspace.importResumeFile(file)
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入失败，请重试'
    workspace.setNotice(message)
  }
}

async function handleExport(format: ExportFormat): Promise<void> {
  if (format === 'pdf') {
    openPrintView()
    return
  }

  if (format === 'json') {
    await workspace.exportCurrentJson()
    return
  }

  if (format === 'html') {
    await workspace.exportCurrentHtml()
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden flex-col bg-stone-100 text-stone-900">
    <ResumeToolbar
      :resumes="resumeOptions"
      :current-resume="workspace.currentResume"
      :current-resume-id="workspace.currentResumeId"
      :mobile-pane="workspace.mobilePane"
      :save-error="workspace.saveError"
      :has-source-html="workspace.hasSourceHtml"
      @switch-resume="workspace.switchResume"
      @create-resume="workspace.createResume"
      @rename-resume="workspace.renameCurrentResume"
      @delete-resume="deleteCurrentResume"
      @reset-resume="resetCurrentResume"
      @sync-preview="syncStructuredPreview"
      @export-format="handleExport"
      @import-file="handleImportFile"
      @update-template="workspace.updateTemplate"
      @update-preview-mode="workspace.updatePreviewMode"
      @update-style="workspace.updateStyle"
      @set-mobile-pane="workspace.setMobilePane"
      @clear-workspace="clearAllLocalData"
    />

    <main
      v-if="workspace.currentResume && workspace.isReady"
      class="mx-auto grid min-h-0 w-full max-w-[1880px] flex-1 items-stretch gap-4 overflow-hidden px-0 pb-4 lg:grid-cols-[minmax(0,1.14fr)_minmax(460px,0.86fr)] lg:pb-6 xl:gap-6"
    >
      <div :class="{ hidden: workspace.mobilePane !== 'editor' }" class="h-full min-h-0 overflow-hidden lg:block">
        <ResumeEditor
          :resume="workspace.currentResume"
          :ordered-sections="workspace.orderedSections"
          :photo-url="workspace.photoUrl"
          @update-basics="workspace.updateBasicsField($event.key, $event.value)"
          @toggle-section="workspace.toggleSection"
          @rename-section="workspace.renameSection($event.sectionId, $event.label)"
          @add-custom-section="workspace.addCustomSection"
          @remove-section="workspace.removeSection"
          @sync-preview="syncStructuredPreview"
          @add-item="workspace.addItem"
          @update-item="workspace.updateItem($event.sectionId, $event.itemId, $event.patch)"
          @remove-item="workspace.removeItem($event.sectionId, $event.itemId)"
          @reorder-sections="workspace.reorderSections"
          @reorder-items="workspace.reorderItems($event.sectionId, $event.itemIds)"
          @replace-items="workspace.replaceSectionItems($event.sectionId, $event.items)"
          @pick-photo="openPhotoPicker"
          @remove-photo="workspace.removePhoto"
        />
      </div>

      <div :class="{ hidden: workspace.mobilePane !== 'preview' }" class="h-full min-h-0 overflow-hidden lg:block">
        <ResumePreviewPane
          :resume="workspace.currentResume"
          :photo-url="workspace.photoUrl"
          :scale="workspace.previewScale"
          :show-local-image-hint="workspace.currentResume?.previewMode === 'source-html' && workspace.sourceHtmlHasLocalImage"
        />
      </div>
    </main>

    <div v-else class="flex min-h-[60vh] items-center justify-center text-stone-500">正在初始化本地工作台...</div>

    <div
      v-if="workspace.notice"
      class="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg"
    >
      {{ workspace.notice }}
    </div>

    <input
      ref="photoInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="handlePhotoFile"
    />
  </div>
</template>
