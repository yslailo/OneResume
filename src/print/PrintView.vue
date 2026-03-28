<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ResumeDocumentView from '@/components/ResumeDocument.vue'
import ResumeHtmlFrame from '@/components/ResumeHtmlFrame.vue'
import { getPhotoAsset } from '@/persistence/assetsRepository'
import { renderResumeIntoHtmlTemplate } from '@/persistence/htmlTemplateSync'
import { photoAssetToDataUrl } from '@/persistence/jsonExchange'
import { sanitizeFileName } from '@/utils/files'
import { useWorkspaceStore } from '@/stores/workspace'

const route = useRoute()
const workspace = useWorkspaceStore()
const exportPhotoSrc = ref<string | null>(null)
const hasPrinted = ref(false)

const resumeId = computed(() => String(route.params.resumeId))
const shouldAutoPrint = computed(() => route.query.autoprint === '1')
const currentTitle = computed(() => sanitizeFileName(workspace.currentResume?.title || 'resume'))
const syncedHtml = computed(() =>
  workspace.currentResume?.previewMode === 'source-html-sync' &&
  workspace.currentResume.rawSourceHtml
    ? renderResumeIntoHtmlTemplate(workspace.currentResume.rawSourceHtml, workspace.currentResume, exportPhotoSrc.value)
    : null,
)
const structuredPhotoSrc = computed(() => exportPhotoSrc.value ?? workspace.photoUrl)

async function hydrateExportPhoto(): Promise<void> {
  exportPhotoSrc.value = null
  if (!workspace.currentResume?.photoAssetId) {
    return
  }

  const asset = await getPhotoAsset(workspace.currentResume.photoAssetId)
  exportPhotoSrc.value = (await photoAssetToDataUrl(asset)) ?? null
}

function setPrintDocumentTitle(): void {
  document.title = `${currentTitle.value}.pdf`
}

async function waitForTopLevelImages(): Promise<void> {
  const images = Array.from(document.images).filter((image) => !image.complete)
  if (images.length === 0) {
    return
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )
}

async function triggerStructuredPrint(): Promise<void> {
  if (!shouldAutoPrint.value || hasPrinted.value || !workspace.currentResume) {
    return
  }

  if (workspace.currentResume.previewMode === 'source-html' || workspace.currentResume.previewMode === 'source-html-sync') {
    return
  }

  hasPrinted.value = true
  await nextTick()
  await waitForTopLevelImages()
  window.setTimeout(() => {
    window.focus()
    window.print()
  }, 180)
}

onMounted(async () => {
  if (!workspace.isReady) {
    await workspace.bootstrap(resumeId.value)
  } else {
    await workspace.switchResume(resumeId.value)
  }

  await hydrateExportPhoto()
  setPrintDocumentTitle()
  await triggerStructuredPrint()
})

watch(
  () => workspace.currentResume?.id,
  async () => {
    hasPrinted.value = false
    await hydrateExportPhoto()
    setPrintDocumentTitle()
    await triggerStructuredPrint()
  },
)

watch(currentTitle, () => {
  setPrintDocumentTitle()
})
</script>

<template>
  <main class="min-h-screen bg-white px-0 py-0 text-stone-900">
    <ResumeHtmlFrame
      v-if="workspace.currentResume?.previewMode === 'source-html' && workspace.currentResume.rawSourceHtml"
      :html="workspace.currentResume.rawSourceHtml"
      :document-title="`${currentTitle}.pdf`"
      mode="print"
      :auto-print="shouldAutoPrint"
    />
    <ResumeHtmlFrame
      v-else-if="workspace.currentResume?.previewMode === 'source-html-sync' && syncedHtml"
      :html="syncedHtml"
      :document-title="`${currentTitle}.pdf`"
      mode="print"
      :auto-print="shouldAutoPrint"
    />
    <ResumeDocumentView
      v-else-if="workspace.currentResume"
      :resume="workspace.currentResume"
      :photo-url="structuredPhotoSrc"
      mode="print"
    />
    <div v-else class="flex min-h-screen items-center justify-center text-sm text-stone-500">
      正在加载打印视图...
    </div>
  </main>
</template>
