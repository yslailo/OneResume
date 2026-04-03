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
  Eye,
  EyeOff,
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
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-stone-900">
          {{ selection === 'basics' ? '基础信息' : selectedMeta?.label || '模块编辑' }}
        </h2>
      </div>
      <div class="flex items-center text-stone-400">
        <LayoutPanelTop class="h-4 w-4" />
      </div>
    </div>

    <div class="workbench-panel__body px-4 py-4 lg:px-5">
      <div class="flex flex-col gap-3">
        <article
          v-if="showSourceHtmlNotice"
          class="rounded-[24px] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="max-w-2xl">
              当前右侧仍在使用导入文件自带的 HTML 模板预览。这里的修改不会直接覆盖原模板版式；
              如果你想边改边看，可以切到“模板同步预览”，继续沿用上传模板的视觉样式。
            </div>
            <button type="button" class="toolbar-chip" @click="emit('sync-preview')">同步预览</button>
          </div>
        </article>

        <article v-if="selection !== 'basics'" class="workbench-edit-shell">
          <div class="workbench-edit-shell__toolbar justify-end">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="toolbar-chip"
                :disabled="previousSelection === selection"
                @click="emit('select', previousSelection)"
              >
                <ArrowLeft class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="toolbar-chip"
                :disabled="nextSelection === selection"
                @click="emit('select', nextSelection)"
              >
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
                      <span class="mx-2 text-stone-300">·</span>
                      {{ selectedMeta?.label }}
                      <span class="mx-2 text-stone-300">·</span>
                      {{ selectedSection.items.length }} 条内容
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="grid h-10 w-10 place-items-center rounded-full border transition"
                  :class="
                    selectedSection.visible
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-100 text-stone-500'
                  "
                  :title="selectedSection.visible ? '隐藏模块' : '显示模块'"
                  :aria-label="selectedSection.visible ? '隐藏模块' : '显示模块'"
                  @click="emit('toggle-section', selectedSection.id)"
                >
                  <Eye v-if="selectedSection.visible" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
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

        <article v-else class="editor-empty-state">
          当前模块暂时不可用，可能是刚被删除或顺序发生了变化。
          <button type="button" class="toolbar-chip mt-3" @click="emit('select', 'basics')">返回基础信息</button>
        </article>
      </div>
    </div>
  </section>
</template>
