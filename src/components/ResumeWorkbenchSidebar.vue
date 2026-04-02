<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResumeSection } from '@/domain/types'
import type { WorkbenchSelection } from '@/components/workbench'
import { createSectionSelection } from '@/components/workbench'
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  GripVertical,
  LayoutList,
  Plus,
  User,
  Wrench,
} from 'lucide-vue-next'

const props = defineProps<{
  sections: ResumeSection[]
  selection: WorkbenchSelection
  collapsed: boolean
}>()

const emit = defineEmits<{
  (event: 'select', selection: WorkbenchSelection): void
  (event: 'toggle-section', sectionId: string): void
  (event: 'reorder-sections', sectionIds: string[]): void
  (event: 'add-custom-section'): void
  (event: 'toggle-collapse'): void
}>()

const localSections = ref<ResumeSection[]>([...props.sections])

watch(
  () => props.sections,
  (sections) => {
    localSections.value = [...sections]
  },
  { deep: true },
)

const sectionMeta: Record<
  ResumeSection['type'],
  { icon: typeof GraduationCap; hint: string }
> = {
  education: { icon: GraduationCap, hint: '学校、专业、学历' },
  work: { icon: Briefcase, hint: '公司、职位、成果' },
  project: { icon: FolderKanban, hint: '项目、职责、亮点' },
  skills: { icon: Wrench, hint: '技能栈、能力项' },
  custom: { icon: LayoutList, hint: '证书、语言、附加信息' },
}

function getSectionMeta(section: ResumeSection) {
  return sectionMeta[section.type]
}

function emitSectionOrder(): void {
  emit(
    'reorder-sections',
    localSections.value.map((section) => section.id),
  )
}
</script>

<template>
  <aside class="workbench-panel workbench-panel--sidebar" :class="{ 'workbench-panel--sidebar-collapsed': collapsed }">
    <div class="workbench-panel__header">
      <div v-if="!collapsed">
        <p class="workbench-panel__eyebrow">工作台导航</p>
        <h2 class="mt-1 text-sm font-medium text-stone-500">聚焦当前要编辑的模块</h2>
      </div>

      <div class="flex items-center gap-2" :class="{ 'w-full justify-center': collapsed }">
        <button
          v-if="!collapsed"
          type="button"
          class="toolbar-chip"
          @click="emit('add-custom-section')"
        >
          <Plus class="h-4 w-4" />
          新增
        </button>

        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
          @click="emit('toggle-collapse')"
        >
          <ChevronLeft v-if="!collapsed" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="workbench-panel__body px-3 py-3">
      <button
        type="button"
        class="flex w-full items-center rounded-[22px] border px-3 py-3 text-left transition"
        :class="
          selection === 'basics'
            ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
        "
        @click="emit('select', 'basics')"
      >
        <div
          class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
          :class="selection === 'basics' ? 'bg-white/12 text-white' : 'bg-stone-100 text-stone-700'"
        >
          <User class="h-4 w-4" />
        </div>
        <div v-if="!collapsed" class="ml-3 min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">基础信息</div>
          <div
            class="truncate text-xs"
            :class="selection === 'basics' ? 'text-white/72' : 'text-stone-500'"
          >
            姓名、联系方式、头像与简介
          </div>
        </div>
      </button>

      <div v-if="!collapsed" class="mt-4 flex items-center justify-between px-1">
        <div class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">模块列表</div>
        <div class="text-xs text-stone-400">{{ localSections.length }} 个</div>
      </div>

      <draggable
        v-model="localSections"
        item-key="id"
        handle=".drag-section"
        ghost-class="opacity-35"
        class="mt-3 space-y-2"
        @end="emitSectionOrder"
      >
        <template #item="{ element: section, index }">
          <article
            class="group flex items-center rounded-[22px] border px-3 py-3 transition"
            :class="
              selection === createSectionSelection(section.id)
                ? 'border-teal-700 bg-teal-50 text-stone-900 shadow-sm'
                : section.visible
                  ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-300'
            "
          >
            <button
              v-if="!collapsed"
              type="button"
              class="drag-section mr-2 hidden shrink-0 cursor-grab rounded-full p-1 text-stone-400 group-hover:inline-flex"
              @click.stop
            >
              <GripVertical class="h-4 w-4" />
            </button>

            <button
              type="button"
              class="flex min-w-0 flex-1 items-center text-left"
              :class="collapsed ? 'justify-center' : 'gap-3'"
              @click="emit('select', createSectionSelection(section.id))"
            >
              <div
                class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                :class="
                  selection === createSectionSelection(section.id)
                    ? 'bg-teal-100 text-teal-700'
                    : section.visible
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-white text-stone-400'
                "
              >
                <component :is="getSectionMeta(section).icon" class="h-4 w-4" />
              </div>

              <div v-if="!collapsed" class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate text-sm font-semibold">{{ section.label }}</span>
                  <span class="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
                    {{ index + 1 }}
                  </span>
                </div>
                <div class="truncate text-xs" :class="section.visible ? 'text-stone-500' : 'text-stone-400'">
                  {{ getSectionMeta(section).hint }} · {{ section.items.length }} 条
                </div>
              </div>
            </button>

            <button
              v-if="!collapsed"
              type="button"
              class="shrink-0 rounded-full p-2 transition"
              :class="section.visible ? 'text-stone-500 hover:bg-stone-100' : 'text-stone-400 hover:bg-white'"
              @click.stop="emit('toggle-section', section.id)"
            >
              <Eye v-if="section.visible" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </button>
          </article>
        </template>
      </draggable>

      <button
        v-if="collapsed"
        type="button"
        class="mt-3 grid h-12 w-full place-items-center rounded-[22px] border border-dashed border-stone-300 bg-white text-stone-500 transition hover:border-stone-400 hover:text-stone-700"
        @click="emit('add-custom-section')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
  </aside>
</template>
