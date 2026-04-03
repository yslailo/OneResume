<script setup lang="ts">
import type { ResumeStyle } from '@/domain/types'
import { Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  style: ResumeStyle
}>()

const emit = defineEmits<{
  (event: 'update-style', patch: Partial<ResumeStyle>): void
}>()

const options: Array<{
  key: keyof Pick<ResumeStyle, 'showSectionIcons' | 'centerSubtitle' | 'stackItemMeta'>
  title: string
  description: string
}> = [
  {
    key: 'showSectionIcons',
    title: '图标模式',
    description: '给模块标题加上图标，视觉更明显',
  },
  {
    key: 'centerSubtitle',
    title: '基础信息居中',
    description: '让姓名、职位、联系方式和简介整体居中显示',
  },
  {
    key: 'stackItemMeta',
    title: '长标题模式',
    description: '标题和时间分行，减少长文本拥挤',
  },
]

function toggleOption(key: keyof Pick<ResumeStyle, 'showSectionIcons' | 'centerSubtitle' | 'stackItemMeta'>): void {
  emit('update-style', {
    [key]: !props.style[key],
  })
}
</script>

<template>
  <section class="layout-style-card">
    <div class="layout-style-card__header">
      <div class="flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-stone-500" />
        <h3 class="text-lg font-semibold text-stone-900">模式</h3>
      </div>
    </div>

    <div class="mt-5 space-y-4">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="layout-mode-option"
        :aria-pressed="style[option.key]"
        @click="toggleOption(option.key)"
      >
        <div class="min-w-0 text-left">
          <div class="layout-style-label">{{ option.title }}</div>
          <div class="layout-style-help mt-1">{{ option.description }}</div>
        </div>
        <span class="layout-mode-switch" :class="{ 'layout-mode-switch--active': style[option.key] }">
          <span class="layout-mode-switch__thumb" />
        </span>
      </button>
    </div>
  </section>
</template>
