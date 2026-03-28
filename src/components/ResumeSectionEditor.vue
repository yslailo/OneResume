<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResumeItem, ResumeSection } from '@/domain/types'
import { Bold, GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { wrapSelectionWithMarker } from '@/utils/markdownEditing'

const props = defineProps<{
  section: ResumeSection
}>()

const emit = defineEmits<{
  (event: 'add-item', sectionId: string): void
  (event: 'update-item', payload: { sectionId: string; itemId: string; patch: Partial<ResumeItem> }): void
  (event: 'remove-item', payload: { sectionId: string; itemId: string }): void
  (event: 'reorder-items', payload: { sectionId: string; itemIds: string[] }): void
}>()

const localItems = ref<ResumeItem[]>([...props.section.items])
const textareaRefs = ref<Record<string, HTMLTextAreaElement | null>>({})

watch(
  () => props.section.items,
  (items) => {
    localItems.value = [...items]
  },
  { deep: true },
)

function updateItem(itemId: string, patch: Partial<ResumeItem>): void {
  emit('update-item', { sectionId: props.section.id, itemId, patch })
}

function reorderItems(): void {
  emit('reorder-items', {
    sectionId: props.section.id,
    itemIds: localItems.value.map((item) => item.id),
  })
}

function isSkillSection(): boolean {
  return props.section.type === 'skills'
}

function isCustomSection(): boolean {
  return props.section.type === 'custom'
}

function setTextareaRef(key: string, element: HTMLTextAreaElement | null): void {
  if (!element) {
    delete textareaRefs.value[key]
    return
  }

  textareaRefs.value[key] = element
}

async function applyBoldToTextarea(
  textareaKey: string,
  value: string,
  itemId: string,
  patchBuilder: (nextValue: string) => Partial<ResumeItem>,
): Promise<void> {
  const textarea = textareaRefs.value[textareaKey]
  if (!textarea) {
    return
  }

  const result = wrapSelectionWithMarker(
    value,
    textarea.selectionStart ?? value.length,
    textarea.selectionEnd ?? value.length,
    '**',
  )

  updateItem(itemId, patchBuilder(result.value))
  await nextTick()
  textareaRefs.value[textareaKey]?.focus()
  textareaRefs.value[textareaKey]?.setSelectionRange(result.selectionStart, result.selectionEnd)
}
</script>

<template>
  <div class="space-y-4">
    <draggable
      v-model="localItems"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-40"
      @end="reorderItems"
    >
      <template #item="{ element: item, index }">
        <article class="group rounded-[24px] border border-stone-200 bg-stone-50/90 p-4 shadow-sm transition hover:border-stone-300">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">
              <button type="button" class="drag-handle hidden cursor-grab rounded-full p-1 text-stone-400 group-hover:inline-flex">
                <GripVertical class="h-4 w-4" />
              </button>
              条目 {{ index + 1 }}
            </div>
            <button
              type="button"
              class="hidden rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 group-hover:inline-flex"
              @click="emit('remove-item', { sectionId: section.id, itemId: item.id })"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <div v-if="isSkillSection()" class="grid gap-3">
            <label class="field-shell">
              <div class="flex items-center justify-between gap-3">
                <span class="field-label">技能内容</span>
                <button
                  type="button"
                  class="toolbar-chip px-3 py-1.5 text-xs"
                  @mousedown.prevent
                  @click="
                    applyBoldToTextarea(`skills-${item.id}`, item.descriptionMarkdown || item.title, item.id, (nextValue) => ({
                      title: '',
                      subtitle: '',
                      startDate: '',
                      endDate: '',
                      location: '',
                      descriptionMarkdown: nextValue,
                    }))
                  "
                >
                  <Bold class="h-3.5 w-3.5" />
                  加粗
                </button>
              </div>
              <textarea
                :ref="(element) => setTextareaRef(`skills-${item.id}`, element as HTMLTextAreaElement | null)"
                :value="item.descriptionMarkdown || item.title"
                class="field-input min-h-24 resize-y"
                placeholder="- Java / Redis / MySQL&#10;- 计算机网络、操作系统、JVM&#10;- 支持选中文字后点击加粗"
                @input="
                  updateItem(item.id, {
                    title: '',
                    subtitle: '',
                    startDate: '',
                    endDate: '',
                    location: '',
                    descriptionMarkdown: ($event.target as HTMLTextAreaElement).value,
                  })
                "
              />
            </label>
          </div>

          <div v-else-if="isCustomSection()" class="grid gap-3">
            <label class="field-shell">
              <span class="field-label">自定义标题</span>
              <input
                :value="item.title"
                class="field-input"
                placeholder="如语言能力 / 获奖经历 / 证书 / 兴趣爱好"
                @input="updateItem(item.id, { title: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell">
              <span class="field-label">补充说明</span>
              <input
                :value="item.subtitle"
                class="field-input"
                placeholder="如 CET-6 / PMP / 省级一等奖"
                @input="updateItem(item.id, { subtitle: ($event.target as HTMLInputElement).value, startDate: '', endDate: '', location: '' })"
              />
            </label>
            <label class="field-shell">
              <div class="flex items-center justify-between gap-3">
                <span class="field-label">内容（支持轻量 Markdown）</span>
                <button
                  type="button"
                  class="toolbar-chip px-3 py-1.5 text-xs"
                  @mousedown.prevent
                  @click="
                    applyBoldToTextarea(`custom-${item.id}`, item.descriptionMarkdown, item.id, (nextValue) => ({
                      descriptionMarkdown: nextValue,
                      startDate: '',
                      endDate: '',
                      location: '',
                    }))
                  "
                >
                  <Bold class="h-3.5 w-3.5" />
                  加粗
                </button>
              </div>
              <textarea
                :ref="(element) => setTextareaRef(`custom-${item.id}`, element as HTMLTextAreaElement | null)"
                :value="item.descriptionMarkdown"
                class="field-input min-h-28 resize-y"
                placeholder="- 支持列表、强调和链接&#10;- 可用于写证书、语言、获奖、开源、兴趣等内容"
                @input="updateItem(item.id, { descriptionMarkdown: ($event.target as HTMLTextAreaElement).value, startDate: '', endDate: '', location: '' })"
              />
            </label>
          </div>

          <div v-else class="grid gap-3 md:grid-cols-2">
            <label class="field-shell">
              <span class="field-label">标题</span>
              <input
                :value="item.title"
                class="field-input"
                placeholder="如公司名称 / 学校名称 / 项目名称"
                @input="updateItem(item.id, { title: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell">
              <span class="field-label">副标题</span>
              <input
                :value="item.subtitle"
                class="field-input"
                placeholder="如职位 / 专业 / 技术栈"
                @input="updateItem(item.id, { subtitle: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell">
              <span class="field-label">开始时间</span>
              <input
                :value="item.startDate"
                class="field-input"
                placeholder="2024.01"
                @input="updateItem(item.id, { startDate: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell">
              <span class="field-label">结束时间</span>
              <input
                :value="item.endDate"
                class="field-input"
                placeholder="至今"
                @input="updateItem(item.id, { endDate: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell md:col-span-2">
              <span class="field-label">地点</span>
              <input
                :value="item.location"
                class="field-input"
                placeholder="上海 / 远程"
                @input="updateItem(item.id, { location: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="field-shell md:col-span-2">
              <div class="flex items-center justify-between gap-3">
                <span class="field-label">描述（支持轻量 Markdown）</span>
                <button
                  type="button"
                  class="toolbar-chip px-3 py-1.5 text-xs"
                  @mousedown.prevent
                  @click="
                    applyBoldToTextarea(`detail-${item.id}`, item.descriptionMarkdown, item.id, (nextValue) => ({
                      descriptionMarkdown: nextValue,
                    }))
                  "
                >
                  <Bold class="h-3.5 w-3.5" />
                  加粗
                </button>
              </div>
              <textarea
                :ref="(element) => setTextareaRef(`detail-${item.id}`, element as HTMLTextAreaElement | null)"
                :value="item.descriptionMarkdown"
                class="field-input min-h-28 resize-y"
                placeholder="- 用结果导向写 2~4 条成果点&#10;- 支持 **加粗**、*斜体*、列表和链接&#10;- 选中文字后可一键加粗"
                @input="updateItem(item.id, { descriptionMarkdown: ($event.target as HTMLTextAreaElement).value })"
              />
            </label>
          </div>
        </article>
      </template>
    </draggable>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-400 hover:bg-white"
      @click="emit('add-item', section.id)"
    >
      <Plus class="h-4 w-4" />
      {{ isCustomSection() ? '新增内容块' : '新增条目' }}
    </button>
  </div>
</template>
