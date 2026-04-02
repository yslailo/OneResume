<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeDocument, ResumeItem, ResumeSection } from '@/domain/types'
import type { WorkbenchSelection } from '@/components/workbench'
import { getAdjacentWorkbenchSelection, getSectionIdFromSelection } from '@/components/workbench'
import ResumeBasicsEditor from '@/components/ResumeBasicsEditor.vue'
import ResumeSectionEditor from '@/components/ResumeSectionEditor.vue'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  FolderKanban,
  GraduationCap,
  LayoutList,
  LayoutPanelTop,
  Trash2,
  User,
  Wrench,
} from 'lucide-vue-next'

const props = defineProps<{
  resume: ResumeDocument
  orderedSections: ResumeSection[]
  selection: WorkbenchSelection
  photoUrl: string | null
}>()

const emit = defineEmits<{
  (event: 'select', selection: WorkbenchSelection): void
  (event: 'update-basics', payload: { key: keyof ResumeDocument['basics']; value: string }): void
  (event: 'toggle-section', sectionId: string): void
  (event: 'rename-section', payload: { sectionId: string; label: string }): void
  (event: 'remove-section', sectionId: string): void
  (event: 'sync-preview'): void
  (event: 'add-item', sectionId: string): void
  (event: 'update-item', payload: { sectionId: string; itemId: string; patch: Record<string, unknown> }): void
  (event: 'remove-item', payload: { sectionId: string; itemId: string }): void
  (event: 'reorder-items', payload: { sectionId: string; itemIds: string[] }): void
  (event: 'replace-items', payload: { sectionId: string; items: ResumeItem[] }): void
  (event: 'pick-photo'): void
  (event: 'remove-photo'): void
}>()

const sectionMeta: Record<
  ResumeSection['type'],
  { icon: typeof GraduationCap; label: string; hint: string }
> = {
  education: { icon: GraduationCap, label: '教育背景', hint: '学校、专业、学历信息' },
  work: { icon: Briefcase, label: '工作经历', hint: '公司、职位和成果' },
  project: { icon: FolderKanban, label: '项目经历', hint: '项目、职责与亮点' },
  skills: { icon: Wrench, label: '专业技能', hint: '技能栈与能力项' },
  custom: { icon: LayoutList, label: '自定义模块', hint: '证书、语言或附加信息' },
}

const selectedSection = computed(() => {
  const sectionId = getSectionIdFromSelection(props.selection)
  return sectionId ? props.orderedSections.find((section) => section.id === sectionId) ?? null : null
})

const selectedSectionIndex = computed(() =>
  selectedSection.value ? props.orderedSections.findIndex((section) => section.id === selectedSection.value?.id) : -1,
)

const showSourceHtmlNotice = computed(
  () => props.resume.sourceFormat === 'html' && props.resume.previewMode === 'source-html',
)

const previousSelection = computed(() => getAdjacentWorkbenchSelection(props.selection, props.orderedSections, -1))
const nextSelection = computed(() => getAdjacentWorkbenchSelection(props.selection, props.orderedSections, 1))
const selectedMeta = computed(() => (selectedSection.value ? sectionMeta[selectedSection.value.type] : null))
</script>

<template>
  <section class="workbench-panel">
    <div class="workbench-panel__header">
      <div>
        <p class="workbench-panel__eyebrow">{{ selection === 'basics' ? '基础信息' : '模块编辑' }}</p>
        <h2 class="mt-1 text-sm font-medium text-stone-500">
          {{ selection === 'basics' ? '编辑简历头部信息与个人摘要' : '把注意力留给当前模块和编辑框本身' }}
        </h2>
      </div>
      <div class="flex items-center gap-2 text-xs text-stone-500">
        <LayoutPanelTop class="h-4 w-4 text-teal-700" />
        编辑面板
      </div>
    </div>

    <div class="workbench-panel__body px-4 py-4 lg:px-6">
      <div class="flex flex-col gap-4">
        <article
          v-if="showSourceHtmlNotice"
          class="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="max-w-2xl">
              当前右侧仍在使用导入文件自带的 HTML 模板预览。这里的修改不会实时覆盖原模板版式；
              如果你想边改边看，可以切到“模板同步预览”，继续沿用上传模板的视觉样式。
            </div>
            <button type="button" class="toolbar-chip" @click="emit('sync-preview')">同步预览</button>
          </div>
        </article>

        <article v-if="selection !== 'basics'" class="workbench-edit-shell">
          <div class="workbench-edit-shell__toolbar">
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">模块导航</p>
              <p class="mt-1 truncate text-sm text-stone-500">
                {{ selectedMeta?.label }} · {{ selectedMeta?.hint }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="toolbar-chip"
                :disabled="previousSelection === selection"
                @click="emit('select', previousSelection)"
              >
                <ArrowLeft class="h-4 w-4" />
                上一个
              </button>
              <button
                type="button"
                class="toolbar-chip"
                :disabled="nextSelection === selection"
                @click="emit('select', nextSelection)"
              >
                下一个
                <ArrowRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        <ResumeBasicsEditor
          v-if="selection === 'basics'"
          :resume="resume"
          :photo-url="photoUrl"
          @update-basics="emit('update-basics', $event)"
          @pick-photo="emit('pick-photo')"
          @remove-photo="emit('remove-photo')"
        />

        <template v-else-if="selectedSection">
          <article class="workbench-content-card">
            <div class="workbench-content-card__header">
              <div class="min-w-0">
                <p class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">内容编辑</p>
                <div class="mt-2 flex items-center gap-3">
                  <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                    <component :is="selectedMeta?.icon || User" class="h-5 w-5" />
                  </div>
                  <div class="min-w-0">
                    <input
                      :value="selectedSection.label"
                      class="workbench-section-name-input"
                      placeholder="输入模块名称"
                      @input="
                        emit('rename-section', {
                          sectionId: selectedSection.id,
                          label: ($event.target as HTMLInputElement).value,
                        })
                      "
                    />
                    <p class="mt-1 text-sm text-stone-500">
                      第 {{ selectedSectionIndex + 1 }} 个模块
                      <span class="mx-2 text-stone-300">•</span>
                      {{ selectedMeta?.label }}
                      <span class="mx-2 text-stone-300">•</span>
                      {{ selectedSection.items.length }} 条内容
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-500">
                  右侧预览实时响应
                </div>
                <button
                  type="button"
                  class="rounded-full px-4 py-2 text-sm transition"
                  :class="selectedSection.visible ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
                  @click="emit('toggle-section', selectedSection.id)"
                >
                  {{ selectedSection.visible ? '显示中' : '已隐藏' }}
                </button>
                <button
                  v-if="selectedSection.type === 'custom'"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
                  @click="emit('remove-section', selectedSection.id)"
                >
                  <Trash2 class="h-4 w-4" />
                  删除模块
                </button>
              </div>
            </div>

            <div class="workbench-content-card__editor">
              <ResumeSectionEditor
                :section="selectedSection"
                @add-item="emit('add-item', $event)"
                @update-item="emit('update-item', $event)"
                @remove-item="emit('remove-item', $event)"
                @reorder-items="emit('reorder-items', $event)"
                @replace-items="emit('replace-items', $event)"
              />
            </div>
          </article>
        </template>
      </div>
    </div>
  </section>
</template>
