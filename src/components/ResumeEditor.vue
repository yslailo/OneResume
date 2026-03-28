<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResumeDocument, ResumeSection, SectionType } from '@/domain/types'
import ResumeSectionEditor from '@/components/ResumeSectionEditor.vue'
import { Bold, GripVertical, ImageOff, Plus, Rows3, Sparkles, Trash2 } from 'lucide-vue-next'
import { wrapSelectionWithMarker } from '@/utils/markdownEditing'

const props = defineProps<{
  resume: ResumeDocument
  orderedSections: ResumeSection[]
  photoUrl: string | null
}>()

const emit = defineEmits<{
  (event: 'update-basics', payload: { key: keyof ResumeDocument['basics']; value: string }): void
  (event: 'toggle-section', sectionId: string): void
  (event: 'rename-section', payload: { sectionId: string; label: string }): void
  (event: 'update-section-type', payload: { sectionId: string; type: SectionType }): void
  (event: 'add-custom-section'): void
  (event: 'remove-section', sectionId: string): void
  (event: 'sync-preview'): void
  (event: 'add-item', sectionId: string): void
  (event: 'update-item', payload: { sectionId: string; itemId: string; patch: Record<string, unknown> }): void
  (event: 'remove-item', payload: { sectionId: string; itemId: string }): void
  (event: 'reorder-sections', sectionIds: string[]): void
  (event: 'reorder-items', payload: { sectionId: string; itemIds: string[] }): void
  (event: 'pick-photo'): void
  (event: 'remove-photo'): void
}>()

const localSections = ref<ResumeSection[]>([...props.orderedSections])
const summaryTextareaRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.orderedSections,
  (sections) => {
    localSections.value = [...sections]
  },
  { deep: true },
)

const basicsFields = [
  { key: 'name', label: '姓名', placeholder: '林若川' },
  { key: 'title', label: '职位', placeholder: '前端工程师 / 后端开发实习生' },
  { key: 'email', label: '邮箱', placeholder: 'name@example.com' },
  { key: 'phone', label: '电话', placeholder: '138-0000-0000' },
  { key: 'location', label: '地点', placeholder: '上海 / 武汉' },
  { key: 'website', label: '网站', placeholder: 'https://portfolio.example.com' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
] as const

const sectionTypeOptions: Array<{ value: SectionType; label: string }> = [
  { value: 'education', label: '教育背景' },
  { value: 'work', label: '工作经历' },
  { value: 'project', label: '项目经历' },
  { value: 'skills', label: '专业技能' },
  { value: 'custom', label: '自定义模块' },
]

function emitSectionOrder(): void {
  emit(
    'reorder-sections',
    localSections.value.map((section) => section.id),
  )
}

function moveSection(sectionId: string, nextIndex: number): void {
  const currentIndex = localSections.value.findIndex((section) => section.id === sectionId)
  if (currentIndex === -1 || currentIndex === nextIndex) {
    return
  }

  const next = [...localSections.value]
  const [moved] = next.splice(currentIndex, 1)
  next.splice(nextIndex, 0, moved)
  localSections.value = next
  emitSectionOrder()
}

async function applyBoldToSummary(): Promise<void> {
  const textarea = summaryTextareaRef.value
  if (!textarea) {
    return
  }

  const result = wrapSelectionWithMarker(
    props.resume.basics.summary,
    textarea.selectionStart ?? props.resume.basics.summary.length,
    textarea.selectionEnd ?? props.resume.basics.summary.length,
    '**',
  )

  emit('update-basics', { key: 'summary', value: result.value })
  await nextTick()
  summaryTextareaRef.value?.focus()
  summaryTextareaRef.value?.setSelectionRange(result.selectionStart, result.selectionEnd)
}
</script>

<template>
  <section class="workbench-panel">
    <div class="workbench-panel__header">
      <div>
        <p class="workbench-panel__eyebrow">编辑工作台</p>
        <h2 class="mt-1 text-sm font-medium text-stone-500">结构化表单与模块管理</h2>
      </div>
      <div class="flex items-center gap-2 text-xs text-stone-500">
        <Sparkles class="h-4 w-4 text-teal-700" />
        自动保存到本地
      </div>
    </div>

    <div class="workbench-panel__body px-4 py-4 lg:px-6">
      <div class="flex flex-col gap-4">
        <article
          v-if="resume.sourceFormat === 'html' && resume.previewMode === 'source-html'"
          class="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="max-w-2xl">
              当前右侧正在使用导入文件自带的 HTML 模板预览。左侧结构化编辑内容不会实时覆盖原模板排版；
              如果要边改边看，可以直接切到同步预览，继续使用你上传的模板样式。
            </div>
            <button type="button" class="toolbar-chip" @click="emit('sync-preview')">同步预览</button>
          </div>
        </article>

        <article class="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">基础信息</p>
              <h2 class="mt-2 text-xl font-semibold text-stone-900">先把简历主干填完整</h2>
            </div>
            <Sparkles class="h-5 w-5 text-teal-700" />
          </div>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div class="grid gap-3 md:grid-cols-2">
              <label
                v-for="field in basicsFields"
                :key="field.key"
                class="field-shell"
                :class="{ 'md:col-span-2': ['title', 'website', 'github'].includes(field.key) }"
              >
                <span class="field-label">{{ field.label }}</span>
                <input
                  :value="resume.basics[field.key]"
                  class="field-input"
                  :placeholder="field.placeholder"
                  @input="
                    emit('update-basics', {
                      key: field.key,
                      value: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </label>

              <label class="field-shell md:col-span-2">
                <div class="flex items-center justify-between gap-3">
                  <span class="field-label">个人简介</span>
                  <button type="button" class="toolbar-chip px-3 py-1.5 text-xs" @mousedown.prevent @click="applyBoldToSummary">
                    <Bold class="h-3.5 w-3.5" />
                    加粗
                  </button>
                </div>
                <textarea
                  ref="summaryTextareaRef"
                  :value="resume.basics.summary"
                  class="field-input min-h-28 resize-y"
                  placeholder="聚焦你的方向、价值和代表性成果，让 HR 在 10 秒内看懂你。支持选中文字后点击加粗。"
                  @input="emit('update-basics', { key: 'summary', value: ($event.target as HTMLTextAreaElement).value })"
                />
              </label>
            </div>

            <div class="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-4">
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">头像</p>
                  <p class="mt-1 text-sm text-stone-500">默认按常见二寸证件照比例居中裁剪</p>
                </div>
              </div>
              <div class="mx-auto aspect-[35/49] w-full max-w-[144px] overflow-hidden rounded-[22px] bg-stone-200 shadow-inner">
                <img v-if="photoUrl" :src="photoUrl" alt="头像预览" class="h-full w-full object-cover" />
                <div v-else class="flex h-full items-center justify-center text-sm text-stone-400">无头像</div>
              </div>
              <div class="mt-3 flex gap-2">
                <button type="button" class="toolbar-chip flex-1 justify-center" @click="emit('pick-photo')">
                  {{ photoUrl ? '更换' : '上传' }}
                </button>
                <button type="button" class="toolbar-chip flex-1 justify-center" @click="emit('remove-photo')">
                  <ImageOff class="h-4 w-4" />
                  移除
                </button>
              </div>
            </div>
          </div>
        </article>

        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">
            <Rows3 class="h-4 w-4" />
            栏目管理
          </div>
          <button type="button" class="toolbar-chip" @click="emit('add-custom-section')">
            <Plus class="h-4 w-4" />
            新增模块
          </button>
        </div>

        <draggable
          v-model="localSections"
          item-key="id"
          handle=".drag-section"
          ghost-class="opacity-30"
          class="space-y-4"
          @end="emitSectionOrder"
        >
          <template #item="{ element: section, index }">
            <article class="group rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    class="drag-section hidden cursor-grab rounded-full p-1 text-stone-400 group-hover:inline-flex"
                  >
                    <GripVertical class="h-4 w-4" />
                  </button>
                  <div class="text-xs font-semibold tracking-[0.22em] text-stone-400 uppercase">模块 {{ index + 1 }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    v-if="section.type === 'custom'"
                    type="button"
                    class="hidden rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 group-hover:inline-flex"
                    @click="emit('remove-section', section.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-4 py-2 text-sm transition"
                    :class="section.visible ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
                    @click="emit('toggle-section', section.id)"
                  >
                    {{ section.visible ? '显示中' : '已隐藏' }}
                  </button>
                </div>
              </div>

              <div class="mb-5 grid gap-3 lg:grid-cols-3">
                <label class="field-shell">
                  <span class="field-label">模块名称</span>
                  <input
                    :value="section.label"
                    class="field-input"
                    placeholder="输入模块名称"
                    @input="emit('rename-section', { sectionId: section.id, label: ($event.target as HTMLInputElement).value })"
                  />
                </label>

                <label class="field-shell">
                  <span class="field-label">模块类型</span>
                  <select
                    :value="section.type"
                    class="field-input"
                    @change="emit('update-section-type', { sectionId: section.id, type: ($event.target as HTMLSelectElement).value as SectionType })"
                  >
                    <option v-for="option in sectionTypeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="field-shell">
                  <span class="field-label">模块顺序</span>
                  <select
                    :value="index"
                    class="field-input"
                    @change="moveSection(section.id, Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option
                      v-for="orderIndex in localSections.length"
                      :key="`${section.id}-${orderIndex}`"
                      :value="orderIndex - 1"
                    >
                      第 {{ orderIndex }} 位
                    </option>
                  </select>
                </label>
              </div>

              <ResumeSectionEditor
                :section="section"
                @add-item="emit('add-item', $event)"
                @update-item="emit('update-item', $event)"
                @remove-item="emit('remove-item', $event)"
                @reorder-items="emit('reorder-items', $event)"
              />
            </article>
          </template>
        </draggable>
      </div>
    </div>
  </section>
</template>
