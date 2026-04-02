<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResumeItem, ResumeSection } from '@/domain/types'
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import RichTextMarkdownEditor from '@/components/RichTextMarkdownEditor.vue'
import { normalizeSkillItems } from '@/utils/sectionEditing'

const props = defineProps<{
  section: ResumeSection
}>()

const emit = defineEmits<{
  (event: 'add-item', sectionId: string): void
  (event: 'update-item', payload: { sectionId: string; itemId: string; patch: Partial<ResumeItem> }): void
  (event: 'remove-item', payload: { sectionId: string; itemId: string }): void
  (event: 'reorder-items', payload: { sectionId: string; itemIds: string[] }): void
  (event: 'replace-items', payload: { sectionId: string; items: ResumeItem[] }): void
}>()

const localItems = ref<ResumeItem[]>([...props.section.items])

watch(
  () => props.section.items,
  (items) => {
    localItems.value = [...items]

    if (isSkillSection()) {
      const normalizedItems = normalizeSkillItems(items)
      if (!areItemsEqual(items, normalizedItems)) {
        emit('replace-items', { sectionId: props.section.id, items: normalizedItems })
      }
    }
  },
  { deep: true, immediate: true },
)

function isSkillSection(): boolean {
  return props.section.type === 'skills'
}

function isCustomSection(): boolean {
  return props.section.type === 'custom'
}

function areItemsEqual(left: ResumeItem[], right: ResumeItem[]): boolean {
  if (left.length !== right.length) {
    return false
  }

  return left.every((item, index) => {
    const next = right[index]
    return (
      item.id === next.id &&
      item.title === next.title &&
      item.subtitle === next.subtitle &&
      item.startDate === next.startDate &&
      item.endDate === next.endDate &&
      item.location === next.location &&
      item.descriptionHtml === next.descriptionHtml &&
      JSON.stringify(item.highlights) === JSON.stringify(next.highlights)
    )
  })
}

function updateItem(itemId: string, patch: Partial<ResumeItem>): void {
  emit('update-item', { sectionId: props.section.id, itemId, patch })
}

function reorderItems(): void {
  emit('reorder-items', {
    sectionId: props.section.id,
    itemIds: localItems.value.map((item) => item.id),
  })
}

function skillEditorItem(): ResumeItem {
  return normalizeSkillItems(props.section.items)[0]
}

function updateSkillEditor(nextValue: string): void {
  const item = skillEditorItem()
  emit('replace-items', {
    sectionId: props.section.id,
    items: [
      {
        ...item,
        descriptionHtml: nextValue,
      },
    ],
  })
}

function itemHintLabel(): string {
  return isCustomSection() ? '自定义内容' : '经历条目'
}
</script>

<template>
  <div class="space-y-4">
    <template v-if="isSkillSection()">
      <article class="editor-skill-card">
        <div class="editor-skill-card__header">
          <div>
            <div class="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">专业技能</div>
            <p class="mt-1 text-sm text-stone-500">这里是合并后的技能编辑框，支持直接富文本编辑和放大编辑。</p>
          </div>
        </div>

        <div class="field-shell field-shell--editor">
          <RichTextMarkdownEditor
            :model-value="skillEditorItem().descriptionHtml"
            placeholder="输入技能、工具、技术栈或能力点。"
            dialog-title="编辑专业技能"
            min-height="large"
            @update:model-value="updateSkillEditor"
          />
        </div>
      </article>
    </template>

    <template v-else>
      <div v-if="localItems.length === 0" class="editor-empty-state">当前模块还没有内容，先新增一条再开始编辑。</div>

      <draggable
        v-model="localItems"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-40"
        class="space-y-4"
        @end="reorderItems"
      >
        <template #item="{ element: item, index }">
          <article class="editor-item-card">
            <div class="editor-item-card__header">
              <div class="flex items-center gap-3">
                <button type="button" class="editor-item-card__handle drag-handle">
                  <GripVertical class="h-4 w-4" />
                </button>
                <div>
                  <div class="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">条目 {{ index + 1 }}</div>
                  <div class="mt-1 text-xs text-stone-500">{{ itemHintLabel() }}</div>
                </div>
              </div>
              <button
                type="button"
                class="editor-item-card__delete"
                @click="emit('remove-item', { sectionId: section.id, itemId: item.id })"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>

            <div v-if="isCustomSection()" class="editor-item-card__body">
              <label class="field-shell field-shell--editor">
                <span class="field-label">模块名称</span>
                <input
                  :value="item.title"
                  class="field-input"
                  placeholder="例如：语言能力 / 获奖经历 / 证书 / 兴趣爱好"
                  @input="updateItem(item.id, { title: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <label class="field-shell field-shell--editor">
                <span class="field-label">补充说明</span>
                <input
                  :value="item.subtitle"
                  class="field-input"
                  placeholder="例如：CET-6 / PMP / 省级一等奖"
                  @input="updateItem(item.id, { subtitle: ($event.target as HTMLInputElement).value, startDate: '', endDate: '', location: '' })"
                />
              </label>
              <div class="field-shell field-shell--editor">
                <span class="field-label">内容</span>
                <RichTextMarkdownEditor
                  :model-value="item.descriptionHtml"
                  placeholder="输入正文内容。"
                  dialog-title="编辑模块内容"
                  @update:model-value="
                    updateItem(item.id, {
                      descriptionHtml: $event,
                      startDate: '',
                      endDate: '',
                      location: '',
                    })
                  "
                />
              </div>
            </div>

            <div v-else class="editor-item-card__body md:grid-cols-2">
              <label class="field-shell field-shell--editor">
                <span class="field-label">标题</span>
                <input
                  :value="item.title"
                  class="field-input"
                  placeholder="例如：公司名称 / 学校名称 / 项目名称"
                  @input="updateItem(item.id, { title: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <label class="field-shell field-shell--editor">
                <span class="field-label">副标题</span>
                <input
                  :value="item.subtitle"
                  class="field-input"
                  placeholder="例如：职位 / 专业 / 技术栈"
                  @input="updateItem(item.id, { subtitle: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <label class="field-shell field-shell--editor">
                <span class="field-label">开始时间</span>
                <input
                  :value="item.startDate"
                  class="field-input"
                  placeholder="2024.01"
                  @input="updateItem(item.id, { startDate: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <label class="field-shell field-shell--editor">
                <span class="field-label">结束时间</span>
                <input
                  :value="item.endDate"
                  class="field-input"
                  placeholder="至今"
                  @input="updateItem(item.id, { endDate: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <label class="field-shell field-shell--editor md:col-span-2">
                <span class="field-label">地点</span>
                <input
                  :value="item.location"
                  class="field-input"
                  placeholder="上海 / 远程"
                  @input="updateItem(item.id, { location: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <div class="field-shell field-shell--editor md:col-span-2">
                <span class="field-label">描述</span>
                <RichTextMarkdownEditor
                  :model-value="item.descriptionHtml"
                  placeholder="输入成果、职责和亮点内容。"
                  dialog-title="编辑描述"
                  @update:model-value="updateItem(item.id, { descriptionHtml: $event })"
                />
              </div>
            </div>
          </article>
        </template>
      </draggable>

      <button type="button" class="editor-add-button w-full" @click="emit('add-item', section.id)">
        <Plus class="h-4 w-4" />
        {{ isCustomSection() ? '新增内容块' : '新增条目' }}
      </button>
    </template>
  </div>
</template>
