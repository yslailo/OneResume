<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResumeDocument, ResumeSection, ResumeStyle } from '@/domain/types'
import { normalizeResumeStyle } from '@/domain/resume'
import type { WorkbenchSelection } from '@/components/workbench'
import { createSectionSelection } from '@/components/workbench'
import LayoutModeSection from '@/components/LayoutModeSection.vue'
import {
  Blocks,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  GripVertical,
  ImageUp,
  LayoutList,
  Palette,
  Plus,
  Type,
  User,
  Wrench,
} from 'lucide-vue-next'

const props = defineProps<{
  resume: ResumeDocument
  sections: ResumeSection[]
  selection: WorkbenchSelection
  collapsed: boolean
}>()

const emit = defineEmits<{
  (event: 'select', selection: WorkbenchSelection): void
  (event: 'toggle-section', sectionId: string): void
  (event: 'reorder-sections', sectionIds: string[]): void
  (event: 'add-custom-section'): void
  (event: 'add-preset-section', preset: 'self-evaluation' | 'certificates'): void
  (event: 'update-style', patch: Partial<ResumeStyle>): void
  (event: 'toggle-collapse'): void
}>()

const localSections = ref<ResumeSection[]>([...props.sections])
const customColorInputRef = ref<HTMLInputElement | null>(null)
const presetMenuOpen = ref(false)
const safeStyle = computed(() => normalizeResumeStyle(props.resume.style))

watch(
  () => props.sections,
  (sections) => {
    localSections.value = [...sections]
  },
  { deep: true },
)

const sectionMeta: Record<
  ResumeSection['type'],
  { icon: typeof GraduationCap; hint: string; accent: string }
> = {
  education: { icon: GraduationCap, hint: '学校、专业、学历', accent: 'text-violet-600' },
  work: { icon: Briefcase, hint: '公司、职位、成果', accent: 'text-rose-600' },
  project: { icon: FolderKanban, hint: '项目、职责、亮点', accent: 'text-fuchsia-600' },
  skills: { icon: Wrench, hint: '技能栈、能力项', accent: 'text-amber-500' },
  custom: { icon: LayoutList, hint: '证书、语言、附加信息', accent: 'text-sky-600' },
}

const accentPresets = [
  '#111111',
  '#222222',
  '#444444',
  '#5B5B5B',
  '#737373',
  '#8A8A8A',
  '#A3A3A3',
  '#0F52BA',
  '#A40000',
  '#FF5A14',
  '#5B21B6',
  '#2F855A',
]

const fontOptions: Array<{ value: ResumeStyle['fontFamily']; label: string; description: string }> = [
  {
    value: 'alibaba',
    label: '阿里巴巴普惠体',
    description: '适合中文简历的现代无衬线风格',
  },
  {
    value: 'mi-sans',
    label: 'MiSans',
    description: '更圆润，适合互联网岗位与作品集风格',
  },
  {
    value: 'ibm-plex',
    label: 'IBM Plex Sans',
    description: '理性克制，英文信息排版更稳定',
  },
  {
    value: 'source-serif',
    label: 'Source Serif',
    description: '偏正式、适合学术与传统行业',
  },
]

function getSectionMeta(section: ResumeSection) {
  return sectionMeta[section.type]
}

function emitSectionOrder(): void {
  emit(
    'reorder-sections',
    localSections.value.map((section) => section.id),
  )
}

function updateStyle(patch: Partial<ResumeStyle>): void {
  emit('update-style', patch)
}

function currentFontDescription(): string {
  return fontOptions.find((option) => option.value === safeStyle.value.fontFamily)?.description ?? ''
}

function addPresetSection(preset: 'self-evaluation' | 'certificates'): void {
  emit('add-preset-section', preset)
  presetMenuOpen.value = false
}
</script>

<template>
  <aside class="workbench-panel workbench-panel--sidebar !overflow-visible" :class="{ 'workbench-panel--sidebar-collapsed': collapsed }">
    <div class="workbench-panel__header">
      <div v-if="!collapsed" class="flex min-w-0 items-center gap-2">
        <Blocks class="h-4 w-4 text-stone-500" />
        <h2 class="text-sm font-semibold text-stone-900">布局</h2>
      </div>

      <div class="flex items-center gap-2" :class="{ 'w-full justify-center': collapsed }">
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-[18px] border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
          @click="emit('toggle-collapse')"
        >
          <ChevronLeft v-if="!collapsed" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="workbench-panel__body overflow-x-visible px-3 py-3">
      <button
        type="button"
        class="flex w-full items-center rounded-[22px] border px-3 py-3 text-left transition"
        :class="
          selection === 'basics'
            ? 'border-stone-900 bg-white text-stone-900 shadow-sm ring-1 ring-stone-900'
            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
        "
        @click="emit('select', 'basics')"
      >
        <div
          class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
          :class="selection === 'basics' ? 'bg-violet-50 text-violet-600' : 'bg-stone-100 text-stone-700'"
        >
          <User class="h-4 w-4" />
        </div>
        <div v-if="!collapsed" class="ml-3 min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">基础信息</div>
        </div>
      </button>

      <div v-if="collapsed" class="mt-3 flex flex-col items-center gap-2">
        <button
          v-for="section in localSections"
          :key="section.id"
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-[18px] border bg-white transition"
          :class="
            selection === createSectionSelection(section.id)
              ? 'border-stone-900 text-stone-900 shadow-sm ring-1 ring-stone-900'
              : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
          "
          :title="section.label"
          :aria-label="section.label"
          @click="emit('select', createSectionSelection(section.id))"
        >
          <component
            :is="getSectionMeta(section).icon"
            class="h-4 w-4"
            :class="selection === createSectionSelection(section.id) ? 'text-stone-900' : getSectionMeta(section).accent"
          />
        </button>
      </div>

      <div v-else class="mt-3 space-y-2">
        <draggable
          v-model="localSections"
          item-key="id"
          handle=".drag-section"
          ghost-class="opacity-35"
          class="space-y-2"
          @end="emitSectionOrder"
        >
          <template #item="{ element: section }">
            <article
              class="group flex items-center rounded-[22px] border border-stone-200 bg-white px-3 py-3 transition hover:border-stone-300 hover:bg-stone-50"
            >
              <button
                type="button"
                class="drag-section mr-2 inline-flex shrink-0 cursor-grab rounded-full p-1 text-stone-400"
                @click.stop
              >
                <GripVertical class="h-4 w-4" />
              </button>

              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
                @click="emit('select', createSectionSelection(section.id))"
              >
                <component
                  :is="getSectionMeta(section).icon"
                  class="h-4 w-4 shrink-0"
                  :class="getSectionMeta(section).accent"
                />
                <span class="truncate text-sm font-medium text-stone-900">{{ section.label }}</span>
              </button>

              <button
                type="button"
                class="shrink-0 rounded-full p-2 text-stone-500 transition hover:bg-stone-100"
                @click.stop="emit('toggle-section', section.id)"
              >
                <Eye v-if="section.visible" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4 text-stone-300" />
              </button>
            </article>
          </template>
        </draggable>

        <div class="space-y-2">
          <button
            type="button"
            class="editor-add-button w-full rounded-[20px]"
            @click="presetMenuOpen = !presetMenuOpen"
          >
            <Plus class="h-4 w-4" />
            添加模块
          </button>

          <div v-if="presetMenuOpen" class="layout-preset-menu layout-preset-menu--inline">
            <button type="button" class="layout-preset-menu__item" @click="addPresetSection('self-evaluation')">
              <span class="text-xl">💬</span>
              <span>自我评价</span>
            </button>
            <button type="button" class="layout-preset-menu__item" @click="addPresetSection('certificates')">
              <span class="text-xl">🏆</span>
              <span>证书作品</span>
            </button>
          </div>
        </div>

        <section class="layout-style-card mt-4">
          <div class="layout-style-card__header">
            <div class="flex items-center gap-2">
              <Palette class="h-4 w-4 text-stone-500" />
              <h3 class="text-lg font-semibold text-stone-900">主题色</h3>
            </div>
            <button type="button" class="toolbar-chip" @click="customColorInputRef?.click()">
              <Palette class="h-3.5 w-3.5" />
              自定义
            </button>
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              v-for="color in accentPresets"
              :key="color"
              type="button"
              class="layout-color-dot"
              :class="{ 'layout-color-dot--active': safeStyle.accentColor === color }"
              :style="{ backgroundColor: color }"
              @click="updateStyle({ accentColor: color })"
            />
          </div>

          <input
            ref="customColorInputRef"
            type="color"
            class="sr-only"
            :value="safeStyle.accentColor"
            @input="updateStyle({ accentColor: ($event.target as HTMLInputElement).value })"
          />
        </section>

        <section class="layout-style-card">
          <div class="layout-style-card__header">
            <div class="flex items-center gap-2">
              <Type class="h-4 w-4 text-stone-500" />
              <h3 class="text-lg font-semibold text-stone-900">排版</h3>
            </div>
          </div>

          <div class="mt-5 space-y-5">
            <label class="layout-style-field">
              <span class="layout-style-label">字体</span>
              <select
                :value="safeStyle.fontFamily"
                class="layout-style-select"
                @change="updateStyle({ fontFamily: ($event.target as HTMLSelectElement).value as ResumeStyle['fontFamily'] })"
              >
                <option v-for="option in fontOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <span class="layout-style-help">{{ currentFontDescription() }}</span>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">行高</span>
              <div class="layout-style-range">
                <input
                  type="range"
                  min="1.3"
                  max="2"
                  step="0.05"
                  :value="safeStyle.lineHeight"
                  @input="updateStyle({ lineHeight: Number(($event.target as HTMLInputElement).value) })"
                />
                <span>{{ safeStyle.lineHeight.toFixed(2).replace(/0$/, '') }}</span>
              </div>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">基础字号</span>
              <select
                :value="safeStyle.baseFontSize"
                class="layout-style-select"
                @change="updateStyle({ baseFontSize: Number(($event.target as HTMLSelectElement).value) })"
              >
                <option v-for="size in [13, 14, 15, 16, 17, 18]" :key="size" :value="size">
                  {{ size }}px
                </option>
              </select>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">模块标题字号</span>
              <select
                :value="safeStyle.sectionTitleSize"
                class="layout-style-select"
                @change="updateStyle({ sectionTitleSize: Number(($event.target as HTMLSelectElement).value) })"
              >
                <option v-for="size in [15, 16, 17, 18, 19, 20, 22]" :key="size" :value="size">
                  {{ size }}px
                </option>
              </select>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">模块项一级标题字号</span>
              <select
                :value="safeStyle.itemTitleSize"
                class="layout-style-select"
                @change="updateStyle({ itemTitleSize: Number(($event.target as HTMLSelectElement).value) })"
              >
                <option v-for="size in [14, 15, 16, 17, 18, 19, 20]" :key="size" :value="size">
                  {{ size }}px
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="layout-style-card">
          <div class="layout-style-card__header">
            <div class="flex items-center gap-2">
              <LayoutList class="h-4 w-4 text-stone-500" />
              <h3 class="text-lg font-semibold text-stone-900">间距</h3>
            </div>
          </div>

          <div class="mt-5 space-y-5">
            <label class="layout-style-field">
              <span class="layout-style-label">页边距</span>
              <div class="layout-style-range">
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  :value="safeStyle.pageMargin"
                  @input="updateStyle({ pageMargin: Number(($event.target as HTMLInputElement).value) })"
                />
                <span>{{ safeStyle.pageMargin }}mm</span>
              </div>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">模块间距</span>
              <div class="layout-style-range">
                <input
                  type="range"
                  min="8"
                  max="28"
                  step="1"
                  :value="safeStyle.sectionGap"
                  @input="updateStyle({ sectionGap: Number(($event.target as HTMLInputElement).value) })"
                />
                <span>{{ safeStyle.sectionGap }}px</span>
              </div>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">段落间距</span>
              <div class="layout-style-range">
                <input
                  type="range"
                  min="2"
                  max="18"
                  step="1"
                  :value="safeStyle.paragraphGap"
                  @input="updateStyle({ paragraphGap: Number(($event.target as HTMLInputElement).value) })"
                />
                <span>{{ safeStyle.paragraphGap }}px</span>
              </div>
            </label>
          </div>
        </section>

        <LayoutModeSection :style="safeStyle" @update-style="updateStyle" />

        <section class="layout-style-card">
          <div class="layout-style-card__header">
            <div class="flex items-center gap-2">
              <ImageUp class="h-4 w-4 text-stone-500" />
              <h3 class="text-lg font-semibold text-stone-900">头像</h3>
            </div>
          </div>

          <div class="mt-5 space-y-5">
            <label class="layout-style-field">
              <span class="layout-style-label">显示头像</span>
              <select
                :value="safeStyle.showPhoto ? 'show' : 'hide'"
                class="layout-style-select"
                @change="updateStyle({ showPhoto: ($event.target as HTMLSelectElement).value === 'show' })"
              >
                <option value="show">显示</option>
                <option value="hide">隐藏</option>
              </select>
            </label>

            <label class="layout-style-field">
              <span class="layout-style-label">头像位置</span>
              <select
                :value="safeStyle.photoPlacement"
                class="layout-style-select"
                @change="updateStyle({ photoPlacement: ($event.target as HTMLSelectElement).value as ResumeStyle['photoPlacement'] })"
              >
                <option value="right">靠右</option>
                <option value="left">靠左</option>
              </select>
            </label>
          </div>
        </section>
      </div>

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
