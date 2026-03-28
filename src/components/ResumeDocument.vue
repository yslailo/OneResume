<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeDocument, ResumeItem } from '@/domain/types'
import { sortSectionsByOrder } from '@/domain/resume'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  resume: ResumeDocument
  photoUrl: string | null
  mode?: 'preview' | 'print'
}>()

const orderedSections = computed(() =>
  sortSectionsByOrder(props.resume).filter((section) => section.visible && section.items.length > 0),
)

const sidebarSections = computed(() =>
  orderedSections.value.filter((section) => ['skills', 'custom'].includes(section.type)),
)

const mainSections = computed(() =>
  orderedSections.value.filter((section) => !['skills', 'custom'].includes(section.type)),
)

const metaLinks = computed(() =>
  [
    props.resume.basics.email,
    props.resume.basics.phone,
    props.resume.basics.location,
    props.resume.basics.website,
    props.resume.basics.github,
  ].filter(Boolean),
)

const sheetStyle = computed(() => ({
  '--resume-accent': props.resume.style.accentColor,
  '--resume-font-size': `${props.resume.style.baseFontSize}px`,
  '--resume-line-height': String(props.resume.style.lineHeight),
  '--resume-page-margin': `${props.resume.style.pageMargin}mm`,
  '--resume-section-gap': `${props.resume.style.sectionGap}px`,
}))

const shouldShowPhoto = computed(() => Boolean(props.resume.style.showPhoto && props.photoUrl))
const isPhotoLeft = computed(() => props.resume.style.photoPlacement === 'left')

function renderItemMeta(item: ResumeItem): string {
  return [item.subtitle, item.location, [item.startDate, item.endDate].filter(Boolean).join(' - ')]
    .filter(Boolean)
    .join(' · ')
}

function skillContent(item: ResumeItem): string {
  return item.descriptionMarkdown || item.title
}
</script>

<template>
  <article
    class="resume-sheet"
    :class="[`resume-sheet--${resume.templateId}`, { 'resume-sheet--print': mode === 'print' }]"
    :style="sheetStyle"
  >
    <template v-if="resume.templateId !== 'classic-sidebar'">
      <header class="resume-header">
        <div class="space-y-4">
          <div class="flex flex-wrap items-start gap-6" :class="shouldShowPhoto ? 'justify-between' : 'justify-start'">
            <img
              v-if="shouldShowPhoto"
              :src="photoUrl!"
              alt="头像"
              class="h-28 aspect-[35/49] rounded-[24px] object-cover ring-1 ring-stone-200"
              :class="{ 'order-first': isPhotoLeft, 'order-last': !isPhotoLeft }"
            />
            <div class="space-y-2" :class="{ 'order-last': isPhotoLeft, 'order-first': !isPhotoLeft }">
              <div class="text-4xl font-semibold tracking-[-0.04em] text-stone-950">{{ resume.basics.name || '你的名字' }}</div>
              <div class="text-lg text-[var(--resume-accent)]">{{ resume.basics.title || '目标职位 / 专业方向' }}</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
            <span v-for="meta in metaLinks" :key="meta">{{ meta }}</span>
          </div>
          <div
            v-if="resume.basics.summary"
            class="resume-markdown max-w-4xl text-sm text-stone-600"
            v-html="renderMarkdown(resume.basics.summary)"
          />
        </div>
      </header>

      <section class="mt-8 space-y-[var(--resume-section-gap)]">
        <section v-for="section in orderedSections" :key="section.id" class="resume-section">
          <div class="resume-section-title">{{ section.label }}</div>
          <div class="mt-4 space-y-5">
            <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 v-if="item.title" class="text-base font-semibold text-stone-900">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="text-sm text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                </div>
                <p
                  v-if="!['skills', 'custom'].includes(section.type) && renderItemMeta(item)"
                  class="text-xs tracking-[0.16em] text-stone-400 uppercase"
                >
                  {{ renderItemMeta(item) }}
                </p>
              </div>
              <div
                v-if="section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown"
                class="resume-markdown mt-3"
                v-html="renderMarkdown(section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown)"
              />
            </article>
          </div>
        </section>
      </section>
    </template>

    <template v-else>
      <div class="grid gap-8 md:grid-cols-[0.72fr_1.28fr]">
        <aside class="space-y-8 border-b border-stone-200 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-7">
          <div class="flex flex-col gap-3" :class="{ 'items-end text-right': shouldShowPhoto && !isPhotoLeft }">
            <img
              v-if="shouldShowPhoto"
              :src="photoUrl!"
              alt="头像"
              class="h-32 aspect-[35/49] rounded-[24px] object-cover ring-1 ring-stone-200"
            />
            <div class="text-3xl font-semibold tracking-[-0.04em] text-stone-950">{{ resume.basics.name || '你的名字' }}</div>
            <div class="text-base text-[var(--resume-accent)]">{{ resume.basics.title || '目标职位 / 专业方向' }}</div>
            <div class="space-y-1 text-sm text-stone-500">
              <div v-for="meta in metaLinks" :key="meta">{{ meta }}</div>
            </div>
            <div
              v-if="resume.basics.summary"
              class="resume-markdown text-sm text-stone-600"
              v-html="renderMarkdown(resume.basics.summary)"
            />
          </div>

          <section v-for="section in sidebarSections" :key="section.id" class="resume-section">
            <div class="resume-section-title">{{ section.label }}</div>
            <div class="mt-4 space-y-5">
              <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                <h3 v-if="item.title" class="text-sm font-semibold text-stone-900">{{ item.title }}</h3>
                <p v-if="item.subtitle" class="mt-1 text-xs tracking-[0.16em] text-stone-400 uppercase">{{ item.subtitle }}</p>
                <div
                  v-if="section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown"
                  class="resume-markdown mt-2"
                  v-html="renderMarkdown(section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown)"
                />
              </article>
            </div>
          </section>
        </aside>

        <main class="space-y-[var(--resume-section-gap)]">
          <section v-for="section in mainSections" :key="section.id" class="resume-section">
            <div class="resume-section-title">{{ section.label }}</div>
            <div class="mt-4 space-y-5">
              <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 v-if="item.title" class="text-base font-semibold text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="text-sm text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                  </div>
                  <p
                    v-if="!['skills', 'custom'].includes(section.type) && renderItemMeta(item)"
                    class="text-xs tracking-[0.16em] text-stone-400 uppercase"
                  >
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown"
                  class="resume-markdown mt-3"
                  v-html="renderMarkdown(section.type === 'skills' ? skillContent(item) : item.descriptionMarkdown)"
                />
              </article>
            </div>
          </section>
        </main>
      </div>
    </template>
  </article>
</template>
