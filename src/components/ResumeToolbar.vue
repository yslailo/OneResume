<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PhotoPlacement, ResumeDocument, ResumePreviewMode, ResumeTemplateId, ResumeStyle } from '@/domain/types'
import { ChevronDown, Download, Eye, FileInput, MonitorSmartphone, Plus, Printer, RotateCcw, Trash2, Upload } from 'lucide-vue-next'

interface ResumeOption {
  id: string
  title: string
}

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
  (event: 'export-format', format: 'pdf' | 'json' | 'html'): void
  (event: 'import-file', file: File): void
  (event: 'update-template', templateId: ResumeTemplateId): void
  (event: 'update-preview-mode', previewMode: ResumePreviewMode): void
  (event: 'update-style', patch: Partial<ResumeStyle>): void
  (event: 'set-mobile-pane', pane: 'editor' | 'preview'): void
  (event: 'clear-workspace'): void
}>()

const importInputRef = ref<HTMLInputElement | null>(null)

const titleModel = computed({
  get: () => props.currentResume?.title ?? '',
  set: (value: string) => emit('rename-resume', value),
})

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
  <header class="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
    <div class="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-4 lg:px-6">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div class="flex items-center gap-3 pr-2">
            <div class="grid h-11 w-11 place-items-center rounded-2xl bg-stone-900 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M18 10C18 8.89543 18.8954 8 20 8H34L46 20V48C46 49.1046 45.1046 50 44 50H20C18.8954 50 18 49.1046 18 48V10Z" fill="#FAFAF9" />
                <path d="M34 8V18C34 19.1046 34.8954 20 36 20H46" fill="#D6D3D1" />
                <path d="M24 28H40" stroke="#171717" stroke-width="3" stroke-linecap="round" />
                <path d="M24 35H40" stroke="#171717" stroke-width="3" stroke-linecap="round" />
                <path d="M24 42H34" stroke="#171717" stroke-width="3" stroke-linecap="round" />
                <circle cx="45" cy="45" r="10" fill="#0F766E" />
                <path d="M41 45H49" stroke="#F5F5F4" stroke-width="2.6" stroke-linecap="round" />
                <path d="M45 41V49" stroke="#F5F5F4" stroke-width="2.6" stroke-linecap="round" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold tracking-[0.18em] text-stone-900 uppercase">OneResume</div>
              <div class="text-xs text-stone-500">本地优先简历生成器</div>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <select
              :value="currentResumeId"
              class="min-w-52 rounded-[20px] border border-stone-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-teal-700"
              @change="emit('switch-resume', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="resume in resumes" :key="resume.id" :value="resume.id">
                {{ resume.title }}
              </option>
            </select>

            <input
              v-model="titleModel"
              type="text"
              class="min-w-0 flex-1 rounded-[20px] border border-transparent bg-white/80 px-4 py-2 text-sm font-medium text-stone-800 outline-none transition hover:border-stone-300 focus:border-teal-700"
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
            <div class="absolute right-0 top-[calc(100%+10px)] z-30 min-w-48 rounded-[24px] border border-stone-200 bg-white p-2 shadow-xl">
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

      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
            v-for="templateId in ['minimal', 'modern', 'classic-sidebar'] as ResumeTemplateId[]"
            :key="templateId"
            class="toolbar-chip"
            :class="{ 'toolbar-chip--active': currentResume?.templateId === templateId }"
            :disabled="currentResume?.previewMode === 'source-html'"
            :title="currentResume?.previewMode === 'source-html' ? '原模板预览模式下不使用站内模板' : ''"
            @click="emit('update-template', templateId)"
          >
            {{ templateId }}
          </button>
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

        <details class="rounded-[24px] border border-stone-200 bg-white px-4 py-3 shadow-sm open:shadow-md">
          <summary class="cursor-pointer list-none text-sm font-medium text-stone-700">样式面板</summary>
          <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <label class="flex flex-col gap-2 text-xs text-stone-500">
              主题色
              <input
                type="color"
                :value="currentResume?.style.accentColor"
                class="h-10 w-full cursor-pointer rounded-[16px] border border-stone-200 bg-white"
                @input="emit('update-style', { accentColor: ($event.target as HTMLInputElement).value })"
              />
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              字体
              <select
                :value="currentResume?.style.fontFamily"
                class="rounded-[16px] border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-teal-700"
                @change="emit('update-style', { fontFamily: ($event.target as HTMLSelectElement).value as ResumeStyle['fontFamily'] })"
              >
                <option value="sans">无衬线</option>
                <option value="serif">有衬线</option>
              </select>
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              字号
              <input
                type="range"
                min="12"
                max="16"
                step="1"
                :value="currentResume?.style.baseFontSize"
                @input="emit('update-style', { baseFontSize: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              行距
              <input
                type="range"
                min="1.4"
                max="1.9"
                step="0.05"
                :value="currentResume?.style.lineHeight"
                @input="emit('update-style', { lineHeight: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              页边距
              <input
                type="range"
                min="14"
                max="28"
                step="1"
                :value="currentResume?.style.pageMargin"
                @input="emit('update-style', { pageMargin: Number(($event.target as HTMLInputElement).value) })"
              />
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              头像显示
              <select
                :value="currentResume?.style.showPhoto ? 'show' : 'hide'"
                class="rounded-[16px] border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-teal-700"
                @change="emit('update-style', { showPhoto: ($event.target as HTMLSelectElement).value === 'show' })"
              >
                <option value="show">显示头像</option>
                <option value="hide">隐藏头像</option>
              </select>
            </label>

            <label class="flex flex-col gap-2 text-xs text-stone-500">
              头像位置
              <select
                :value="currentResume?.style.photoPlacement"
                class="rounded-[16px] border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-teal-700"
                @change="emit('update-style', { photoPlacement: ($event.target as HTMLSelectElement).value as PhotoPlacement })"
              >
                <option value="right">靠右</option>
                <option value="left">靠左</option>
              </select>
            </label>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <button class="toolbar-chip" @click="emit('clear-workspace')">清空全部本地数据</button>
            <span v-if="saveError" class="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
              {{ saveError }}
            </span>
          </div>
        </details>
      </div>

      <input
        ref="importInputRef"
        type="file"
        accept=".json,.md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html,application/json"
        class="hidden"
        @change="handleFileChange"
      />
    </div>
  </header>
</template>
