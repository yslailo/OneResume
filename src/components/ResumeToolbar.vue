<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResumeDocument, ResumePreviewMode, ResumeTemplateId } from '@/domain/types'
import BrandMark from '@/components/BrandMark.vue'
import { ChevronDown, Download, Eye, FileInput, MonitorSmartphone, Plus, Printer, RotateCcw, Trash2, Upload } from 'lucide-vue-next'

interface ResumeOption {
  id: string
  title: string
}

type ExportFormat = 'pdf' | 'json' | 'html'

const props = defineProps<{
  resumes: ResumeOption[]
  currentResume: ResumeDocument | null
  currentResumeId: string
  mobilePane: 'editor' | 'preview'
  saveError: string | null
  hasSourceHtml: boolean
}>()

const emit = defineEmits<{
  (event: 'switch-resume', id: string): void
  (event: 'create-resume'): void
  (event: 'rename-resume', title: string): void
  (event: 'delete-resume'): void
  (event: 'reset-resume'): void
  (event: 'sync-preview'): void
  (event: 'export-format', format: ExportFormat): void
  (event: 'import-file', file: File): void
  (event: 'update-template', templateId: ResumeTemplateId): void
  (event: 'update-preview-mode', previewMode: ResumePreviewMode): void
  (event: 'set-mobile-pane', pane: 'editor' | 'preview'): void
  (event: 'clear-workspace'): void
}>()

const importInputRef = ref<HTMLInputElement | null>(null)

const titleModel = computed({
  get: () => props.currentResume?.title ?? '',
  set: (value: string) => emit('rename-resume', value),
})

const templateOptions: Array<{ id: ResumeTemplateId; label: string }> = [
  { id: 'minimal', label: '极简' },
  { id: 'modern', label: '现代' },
  { id: 'classic-sidebar', label: '侧栏' },
  { id: 'classic-blue', label: '蓝线' },
]

function openImport(): void {
  importInputRef.value?.click()
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  emit('import-file', file)
  input.value = ''
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/92 backdrop-blur">
    <div class="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:px-6">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div class="flex items-center gap-3 pr-2">
            <div class="grid h-10 w-10 place-items-center rounded-[18px] bg-stone-900 shadow-[0_10px_26px_rgba(15,23,42,0.12)]">
              <BrandMark :size="24" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold tracking-[0.18em] text-stone-900 uppercase">OneResume</div>
              <div class="text-xs text-stone-500">本地优先简历工作台</div>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <select
              :value="currentResumeId"
              class="min-w-52 rounded-[18px] border border-stone-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-teal-700"
              @change="emit('switch-resume', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="resume in resumes" :key="resume.id" :value="resume.id">
                {{ resume.title }}
              </option>
            </select>

            <input
              v-model="titleModel"
              type="text"
              class="min-w-0 flex-1 rounded-[18px] border border-transparent bg-white/80 px-4 py-2 text-sm font-medium text-stone-800 outline-none transition hover:border-stone-300 focus:border-teal-700"
              placeholder="输入简历名称"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button class="toolbar-button toolbar-button--solid" @click="emit('create-resume')">
            <Plus class="h-4 w-4" />
            新建
          </button>
          <button class="toolbar-button" @click="openImport">
            <FileInput class="h-4 w-4" />
            导入
          </button>
          <details class="relative">
            <summary class="toolbar-button list-none">
              <Download class="h-4 w-4" />
              导出
              <ChevronDown class="h-4 w-4" />
            </summary>
            <div class="absolute right-0 top-[calc(100%+10px)] z-30 min-w-52 rounded-[24px] border border-stone-200 bg-white p-2 shadow-xl">
              <button type="button" class="toolbar-menu-item" @click="emit('export-format', 'pdf')">
                <Printer class="h-4 w-4" />
                导出 PDF
              </button>
              <button type="button" class="toolbar-menu-item" @click="emit('export-format', 'json')">
                <Upload class="h-4 w-4" />
                导出工程文件
              </button>
              <button
                v-if="hasSourceHtml"
                type="button"
                class="toolbar-menu-item"
                @click="emit('export-format', 'html')"
              >
                <Eye class="h-4 w-4" />
                导出原始 HTML
              </button>
            </div>
          </details>
          <button class="toolbar-button" @click="emit('reset-resume')">
            <RotateCcw class="h-4 w-4" />
            重置
          </button>
          <button class="toolbar-button toolbar-button--danger" @click="emit('delete-resume')">
            <Trash2 class="h-4 w-4" />
            删除
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="hasSourceHtml">
            <span class="text-xs font-semibold tracking-[0.24em] text-stone-500 uppercase">展示模式</span>
            <button
              class="toolbar-chip"
              :class="{ 'toolbar-chip--active': currentResume?.previewMode === 'source-html' }"
              @click="emit('update-preview-mode', 'source-html')"
            >
              原模板预览
            </button>
            <button
              class="toolbar-chip"
              :class="{ 'toolbar-chip--active': currentResume?.previewMode === 'source-html-sync' }"
              @click="emit('update-preview-mode', 'source-html-sync')"
            >
              模板同步
            </button>
            <button
              class="toolbar-chip"
              :class="{ 'toolbar-chip--active': currentResume?.previewMode === 'structured' }"
              @click="emit('update-preview-mode', 'structured')"
            >
              结构化预览
            </button>
            <button
              v-if="currentResume?.previewMode === 'source-html'"
              class="toolbar-chip"
              @click="emit('sync-preview')"
            >
              同步预览
            </button>
          </template>

          <span class="text-xs font-semibold tracking-[0.24em] text-stone-500 uppercase">模板</span>
          <button
            v-for="template in templateOptions"
            :key="template.id"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': currentResume?.templateId === template.id }"
            :disabled="currentResume?.previewMode === 'source-html'"
            :title="currentResume?.previewMode === 'source-html' ? '原模板预览模式下不使用站内模板' : ''"
            @click="emit('update-template', template.id)"
          >
            {{ template.label }}
          </button>

          <button class="toolbar-chip" @click="emit('clear-workspace')">清空本地数据</button>
          <span v-if="saveError" class="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
            {{ saveError }}
          </span>
        </div>

        <div class="flex items-center gap-2 md:hidden">
          <button
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': mobilePane === 'editor' }"
            @click="emit('set-mobile-pane', 'editor')"
          >
            <MonitorSmartphone class="h-4 w-4" />
            编辑
          </button>
          <button
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': mobilePane === 'preview' }"
            @click="emit('set-mobile-pane', 'preview')"
          >
            <Eye class="h-4 w-4" />
            预览
          </button>
        </div>
      </div>

      <input
        ref="importInputRef"
        type="file"
        accept=".json,.md,.markdown,.txt,.html,.htm,.pdf,text/markdown,text/plain,text/html,application/json,application/pdf"
        class="hidden"
        @change="handleFileChange"
      />
    </div>
  </header>
</template>
