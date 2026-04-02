<script setup lang="ts">
import type { ResumeDocument } from '@/domain/types'
import { ImageOff, Sparkles } from 'lucide-vue-next'
import RichTextMarkdownEditor from '@/components/RichTextMarkdownEditor.vue'

defineProps<{
  resume: ResumeDocument
  photoUrl: string | null
}>()

const emit = defineEmits<{
  (event: 'update-basics', payload: { key: keyof ResumeDocument['basics']; value: string }): void
  (event: 'pick-photo'): void
  (event: 'remove-photo'): void
}>()

const basicsFields = [
  { key: 'name', label: '姓名', placeholder: '例如：林若川' },
  { key: 'title', label: '职位', placeholder: '例如：前端工程师 / 产品设计师' },
  { key: 'email', label: '邮箱', placeholder: 'name@example.com' },
  { key: 'phone', label: '电话', placeholder: '138-0000-0000' },
  { key: 'location', label: '地点', placeholder: '上海 / 深圳 / 远程' },
  { key: 'website', label: '网站', placeholder: 'https://portfolio.example.com' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
] as const
</script>

<template>
  <article class="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">基础信息</p>
      </div>
      <Sparkles class="h-5 w-5 text-teal-700" />
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
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

        <div class="field-shell md:col-span-2">
          <span class="field-label">个人简介</span>
          <RichTextMarkdownEditor
            :model-value="resume.basics.summaryHtml"
            placeholder="聚焦你的方向、价值和代表性成果，让招聘方快速看懂你。"
            dialog-title="编辑个人简介"
            @update:model-value="emit('update-basics', { key: 'summaryHtml', value: $event })"
          />
        </div>
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
</template>
