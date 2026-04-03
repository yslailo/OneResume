<script setup lang="ts">
import { computed } from 'vue'
import { Briefcase, FolderKanban, GraduationCap, LayoutList, Wrench } from 'lucide-vue-next'
import { normalizeResumeStyle, sortSectionsByOrder } from '@/domain/resume'
import type { ResumeDocument as ResumeSchema, ResumeItem, ResumeSection } from '@/domain/types'

const props = defineProps<{
  resume: ResumeSchema
  photoUrl: string | null
  mode?: 'preview' | 'print'
}>()

const orderedSections = computed(() =>
  sortSectionsByOrder(props.resume).filter((section) => section.visible && section.items.length > 0),
)

const supportingSections = computed(() =>
  orderedSections.value.filter((section) => ['skills', 'custom'].includes(section.type)),
)

const narrativeSections = computed(() =>
  orderedSections.value.filter((section) => !['skills', 'custom'].includes(section.type)),
)

const compactSidebarSections = computed(() =>
  orderedSections.value.filter((section) => ['education', 'skills', 'custom'].includes(section.type)),
)

const compactMainSections = computed(() =>
  orderedSections.value.filter((section) => !['education', 'skills', 'custom'].includes(section.type)),
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

const metaRows = computed(() =>
  [
    { label: '邮箱', value: props.resume.basics.email },
    { label: '电话', value: props.resume.basics.phone },
    { label: '城市', value: props.resume.basics.location },
    { label: '网站', value: props.resume.basics.website },
    { label: 'GitHub', value: props.resume.basics.github },
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry.value?.trim())),
)

const atsMetaLine = computed(() => metaLinks.value.join(' | '))
const blueHeaderLocation = computed(() => props.resume.basics.location?.trim() || '')
const blueHeaderContact = computed(() =>
  [props.resume.basics.phone, props.resume.basics.email].filter(Boolean).join(' | '),
)
const blueHeaderLinks = computed(() =>
  [props.resume.basics.website, props.resume.basics.github].filter(Boolean).join(' | '),
)

const safeStyle = computed(() => normalizeResumeStyle(props.resume.style))

const fontFamilyStack = computed(() => {
  const mapping: Record<string, string> = {
    alibaba: '"Alibaba PuHuiTi 3.0", "MiSans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    'mi-sans': '"MiSans", "Alibaba PuHuiTi 3.0", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    'ibm-plex': '"IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    'source-serif': '"Source Serif 4", "Noto Serif SC", Georgia, serif',
    sans: '"Alibaba PuHuiTi 3.0", "MiSans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: '"Source Serif 4", "Noto Serif SC", Georgia, serif',
  }

  return mapping[safeStyle.value.fontFamily] ?? mapping.alibaba
})

const sheetStyle = computed(() => ({
  '--resume-accent': safeStyle.value.accentColor,
  '--resume-font-family': fontFamilyStack.value,
  '--resume-font-size': `${safeStyle.value.baseFontSize}px`,
  '--resume-section-title-size': `${safeStyle.value.sectionTitleSize}px`,
  '--resume-item-title-size': `${safeStyle.value.itemTitleSize}px`,
  '--resume-line-height': String(safeStyle.value.lineHeight),
  '--resume-page-margin': `${safeStyle.value.pageMargin}mm`,
  '--resume-section-gap': `${safeStyle.value.sectionGap}px`,
  '--resume-paragraph-gap': `${safeStyle.value.paragraphGap}px`,
}))

const shouldShowPhoto = computed(() => Boolean(safeStyle.value.showPhoto && props.photoUrl))
const isPhotoLeft = computed(() => safeStyle.value.photoPlacement === 'left')
const useStackItemMeta = computed(() => safeStyle.value.stackItemMeta)
const shouldCenterBasics = computed(() => safeStyle.value.centerSubtitle)
const displayName = computed(() => props.resume.basics.name || '你的名字')
const displayTitle = computed(() => props.resume.basics.title || '目标岗位 / 专业方向')

const sectionIconMap = {
  education: GraduationCap,
  work: Briefcase,
  project: FolderKanban,
  skills: Wrench,
  custom: LayoutList,
} as const

function renderItemMeta(item: ResumeItem): string {
  return [item.subtitle, item.location, [item.startDate, item.endDate].filter(Boolean).join(' - ')]
    .filter(Boolean)
    .join(' | ')
}

function renderDateRange(item: ResumeItem): string {
  return [item.startDate, item.endDate].filter(Boolean).join(' - ')
}

function skillContent(item: ResumeItem): string {
  return item.descriptionHtml || (item.title ? `<p>${item.title}</p>` : '')
}

function sectionBodyHtml(section: ResumeSection, item: ResumeItem): string {
  return section.type === 'skills' ? skillContent(item) : item.descriptionHtml
}

function renderBlueHeadingLine(section: ResumeSection, item: ResumeItem): string {
  if (section.type === 'education') {
    return [item.title, item.subtitle, item.location].filter(Boolean).join(' | ')
  }

  return item.title
}

function renderBlueAsideMeta(section: ResumeSection, item: ResumeItem): string {
  if (section.type === 'project') {
    return item.subtitle || renderDateRange(item)
  }

  return renderDateRange(item)
}

function sectionIcon(section: ResumeSection) {
  return sectionIconMap[section.type]
}
</script>

<template>
  <article
    class="resume-sheet"
    :class="[`resume-sheet--${resume.templateId}`, { 'resume-sheet--print': mode === 'print' }]"
    :style="sheetStyle"
  >
    <template v-if="resume.templateId === 'classic-sidebar'">
      <div class="resume-layout resume-layout--sidebar grid gap-8 md:grid-cols-[0.72fr_1.28fr]">
        <aside class="space-y-8 border-b border-stone-200 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-7">
          <div
            class="flex flex-col gap-3"
            :class="
              shouldCenterBasics
                ? 'items-center text-center'
                : shouldShowPhoto && !isPhotoLeft
                  ? 'items-end text-right'
                  : 'items-start text-left'
            "
          >
            <img
              v-if="shouldShowPhoto"
              :src="photoUrl!"
              alt="头像"
              class="h-32 aspect-[35/49] rounded-[24px] object-cover ring-1 ring-stone-200"
            />
            <div class="text-3xl font-semibold tracking-[-0.04em] text-stone-950">{{ displayName }}</div>
            <div class="w-full text-base text-[var(--resume-accent)]">{{ displayTitle }}</div>
            <div class="space-y-1 text-sm text-stone-500">
              <div v-for="meta in metaLinks" :key="meta">{{ meta }}</div>
            </div>
            <div
              v-if="resume.basics.summaryHtml"
              class="resume-richtext text-sm text-stone-600"
              :class="{ 'mx-auto text-center': shouldCenterBasics }"
              v-html="resume.basics.summaryHtml"
            />
          </div>

          <section v-for="section in supportingSections" :key="section.id" class="resume-section">
            <div class="resume-section-title">
              <component
                :is="sectionIcon(section)"
                v-if="safeStyle.showSectionIcons"
                class="h-[0.95em] w-[0.95em]"
              />
              {{ section.label }}
            </div>
            <div class="mt-4 space-y-5">
              <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                <p v-if="item.subtitle" class="resume-item-subtitle mt-1 text-stone-400 uppercase">
                  {{ item.subtitle }}
                </p>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-2"
                  v-html="sectionBodyHtml(section, item)"
                />
              </article>
            </div>
          </section>
        </aside>

        <main class="space-y-[var(--resume-section-gap)]">
          <section v-for="section in narrativeSections" :key="section.id" class="resume-section">
            <div class="resume-section-title">
              <component
                :is="sectionIcon(section)"
                v-if="safeStyle.showSectionIcons"
                class="h-[0.95em] w-[0.95em]"
              />
              {{ section.label }}
            </div>
            <div class="mt-4 space-y-5">
              <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                <div
                  class="flex flex-wrap items-start justify-between gap-2"
                  :class="{ 'flex-col !items-start': useStackItemMeta }"
                >
                  <div>
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-[var(--resume-accent)]">
                      {{ item.subtitle }}
                    </p>
                  </div>
                  <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.16em] text-stone-400 uppercase">
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-3"
                  v-html="sectionBodyHtml(section, item)"
                />
              </article>
            </div>
          </section>
        </main>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'classic-blue'">
      <div class="resume-layout resume-layout--blue">
        <header class="resume-blue-header">
          <div class="resume-blue-header__main">
            <div class="resume-blue-header__identity" :class="{ 'text-center': shouldCenterBasics }">
              <h1 class="resume-blue-header__name">{{ displayName }}</h1>
              <p v-if="blueHeaderLocation" class="resume-blue-header__meta">{{ blueHeaderLocation }}</p>
              <p v-if="blueHeaderContact" class="resume-blue-header__meta">{{ blueHeaderContact }}</p>
              <p v-if="blueHeaderLinks" class="resume-blue-header__meta">{{ blueHeaderLinks }}</p>
              <p class="resume-blue-header__target">
                <strong>求职方向：{{ displayTitle }}</strong>
              </p>
            </div>

            <img
              v-if="shouldShowPhoto"
              :src="photoUrl!"
              alt="头像"
              class="resume-blue-header__photo"
              :class="{ 'order-first': isPhotoLeft, 'order-last': !isPhotoLeft }"
            />
          </div>

          <div
            v-if="resume.basics.summaryHtml"
            class="resume-richtext resume-blue-header__summary"
            :class="{ 'text-center': shouldCenterBasics }"
            v-html="resume.basics.summaryHtml"
          />
        </header>

        <section class="resume-blue-sections">
          <section v-for="section in orderedSections" :key="section.id" class="resume-section">
            <div class="resume-blue-section-title">
              <component
                :is="sectionIcon(section)"
                v-if="safeStyle.showSectionIcons"
                class="h-[0.95em] w-[0.95em]"
              />
              {{ section.label }}
            </div>
            <div class="resume-blue-section__items">
              <article v-for="item in section.items" :key="item.id" class="resume-blue-item break-inside-avoid">
                <template v-if="section.type === 'skills'">
                  <div
                    v-if="skillContent(item)"
                    class="resume-richtext resume-blue-item__markdown resume-blue-item__markdown--compact"
                    v-html="skillContent(item)"
                  />
                </template>

                <template v-else-if="section.type === 'custom'">
                  <div
                    v-if="item.title || item.subtitle"
                    class="resume-blue-item__header resume-blue-item__header--stack"
                  >
                    <div class="resume-blue-item__title resume-item-title">{{ item.title }}</div>
                    <div v-if="item.subtitle" class="resume-blue-item__subtle">{{ item.subtitle }}</div>
                  </div>
                  <div
                    v-if="item.descriptionHtml"
                    class="resume-richtext resume-blue-item__markdown resume-blue-item__markdown--compact"
                    v-html="item.descriptionHtml"
                  />
                </template>

                <template v-else>
                  <div class="resume-blue-item__header" :class="{ 'resume-blue-item__header--stack': useStackItemMeta }">
                    <div class="resume-blue-item__title resume-item-title">{{ renderBlueHeadingLine(section, item) }}</div>
                    <div v-if="renderBlueAsideMeta(section, item)" class="resume-blue-item__date">
                      {{ renderBlueAsideMeta(section, item) }}
                    </div>
                  </div>
                  <p v-if="section.type === 'work' && item.subtitle" class="resume-blue-item__subtle">
                    {{ item.subtitle }}
                  </p>
                  <div
                    v-if="item.descriptionHtml"
                    class="resume-richtext resume-blue-item__markdown resume-blue-item__markdown--compact"
                    v-html="item.descriptionHtml"
                  />
                </template>
              </article>
            </div>
          </section>
        </section>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'executive'">
      <div class="resume-layout resume-layout--executive">
        <header class="resume-executive-hero">
          <div class="resume-executive-hero__main">
            <p class="resume-executive-hero__eyebrow">Executive Profile</p>
            <h1 class="resume-executive-hero__name">{{ displayName }}</h1>
            <p class="resume-executive-hero__title">{{ displayTitle }}</p>
            <div
              v-if="resume.basics.summaryHtml"
              class="resume-richtext resume-executive-hero__summary"
              v-html="resume.basics.summaryHtml"
            />
          </div>

          <aside class="resume-executive-hero__side">
            <img
              v-if="shouldShowPhoto"
              :src="photoUrl!"
              alt="头像"
              class="resume-executive-hero__photo"
              :class="{ 'order-first': isPhotoLeft, 'order-last': !isPhotoLeft }"
            />
            <div class="resume-executive-meta-card">
              <div v-for="entry in metaRows" :key="entry.label" class="resume-executive-meta-card__row">
                <span>{{ entry.label }}</span>
                <strong>{{ entry.value }}</strong>
              </div>
            </div>
          </aside>
        </header>

        <div class="resume-executive-grid">
          <main class="resume-executive-grid__main">
            <section v-for="section in narrativeSections" :key="section.id" class="resume-panel-card">
              <div class="resume-section-title">
                <component
                  :is="sectionIcon(section)"
                  v-if="safeStyle.showSectionIcons"
                  class="h-[0.95em] w-[0.95em]"
                />
                {{ section.label }}
              </div>
              <div class="mt-4 space-y-5">
                <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                  <div
                    class="flex flex-wrap items-start justify-between gap-2"
                    :class="{ 'flex-col !items-start': useStackItemMeta }"
                  >
                    <div>
                      <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                      <p v-if="item.subtitle" class="resume-item-subtitle text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                    </div>
                    <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.16em] text-stone-400 uppercase">
                      {{ renderItemMeta(item) }}
                    </p>
                  </div>
                  <div
                    v-if="sectionBodyHtml(section, item)"
                    class="resume-richtext mt-3"
                    v-html="sectionBodyHtml(section, item)"
                  />
                </article>
              </div>
            </section>
          </main>

          <aside class="resume-executive-grid__side">
            <section v-for="section in supportingSections" :key="section.id" class="resume-panel-card resume-panel-card--soft">
              <div class="resume-section-title">
                <component
                  :is="sectionIcon(section)"
                  v-if="safeStyle.showSectionIcons"
                  class="h-[0.95em] w-[0.95em]"
                />
                {{ section.label }}
              </div>
              <div class="mt-4 space-y-4">
                <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                  <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="resume-item-subtitle mt-1 text-stone-500">{{ item.subtitle }}</p>
                  <div
                    v-if="sectionBodyHtml(section, item)"
                    class="resume-richtext mt-2"
                    v-html="sectionBodyHtml(section, item)"
                  />
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'compact'">
      <div class="resume-layout resume-layout--compact">
        <header class="resume-compact-header">
          <div class="resume-compact-header__main">
            <h1 class="resume-compact-header__name">{{ displayName }}</h1>
            <p class="resume-compact-header__title">{{ displayTitle }}</p>
          </div>
          <div class="resume-compact-header__meta">
            <span v-for="meta in metaLinks" :key="meta">{{ meta }}</span>
          </div>
        </header>

        <div class="resume-compact-grid">
          <aside class="resume-compact-column">
            <section v-if="resume.basics.summaryHtml" class="resume-panel-card resume-panel-card--soft">
              <div class="resume-section-title">摘要</div>
              <div class="resume-richtext mt-3" v-html="resume.basics.summaryHtml" />
            </section>

            <section v-for="section in compactSidebarSections" :key="section.id" class="resume-panel-card resume-panel-card--soft">
              <div class="resume-section-title">
                <component
                  :is="sectionIcon(section)"
                  v-if="safeStyle.showSectionIcons"
                  class="h-[0.95em] w-[0.95em]"
                />
                {{ section.label }}
              </div>
              <div class="mt-3 space-y-4">
                <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                  <div class="flex flex-col gap-1">
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-stone-500">{{ item.subtitle }}</p>
                    <p
                      v-if="section.type !== 'skills' && renderDateRange(item)"
                      class="text-xs uppercase tracking-[0.16em] text-stone-400"
                    >
                      {{ renderDateRange(item) }}
                    </p>
                  </div>
                  <div
                    v-if="sectionBodyHtml(section, item)"
                    class="resume-richtext mt-2"
                    v-html="sectionBodyHtml(section, item)"
                  />
                </article>
              </div>
            </section>
          </aside>

          <main class="resume-compact-column">
            <section v-for="section in compactMainSections" :key="section.id" class="resume-panel-card">
              <div class="resume-section-title">
                <component
                  :is="sectionIcon(section)"
                  v-if="safeStyle.showSectionIcons"
                  class="h-[0.95em] w-[0.95em]"
                />
                {{ section.label }}
              </div>
              <div class="mt-3 space-y-4">
                <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                  <div
                    class="flex flex-wrap items-start justify-between gap-2"
                    :class="{ 'flex-col !items-start': useStackItemMeta }"
                  >
                    <div>
                      <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                      <p v-if="item.subtitle" class="resume-item-subtitle text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                    </div>
                    <p v-if="renderItemMeta(item)" class="text-xs uppercase tracking-[0.16em] text-stone-400">
                      {{ renderItemMeta(item) }}
                    </p>
                  </div>
                  <div
                    v-if="sectionBodyHtml(section, item)"
                    class="resume-richtext mt-2"
                    v-html="sectionBodyHtml(section, item)"
                  />
                </article>
              </div>
            </section>
          </main>
        </div>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'elegant'">
      <div class="resume-layout resume-layout--elegant">
        <header class="resume-elegant-header" :class="{ 'resume-elegant-header--with-photo': shouldShowPhoto }">
          <img v-if="shouldShowPhoto" :src="photoUrl!" alt="头像" class="resume-elegant-header__photo" />
          <p class="resume-elegant-header__eyebrow">Curriculum Vitae</p>
          <h1 class="resume-elegant-header__name">{{ displayName }}</h1>
          <p class="resume-elegant-header__title">{{ displayTitle }}</p>
          <div class="resume-elegant-meta">
            <span v-for="meta in metaLinks" :key="meta">{{ meta }}</span>
          </div>
          <div
            v-if="resume.basics.summaryHtml"
            class="resume-richtext resume-elegant-header__summary"
            v-html="resume.basics.summaryHtml"
          />
        </header>

        <section class="resume-elegant-sections">
          <section v-for="section in orderedSections" :key="section.id" class="resume-elegant-section">
            <div class="resume-elegant-section__title">{{ section.label }}</div>
            <div class="space-y-4">
              <article v-for="item in section.items" :key="item.id" class="resume-elegant-item break-inside-avoid">
                <div class="resume-elegant-item__heading">
                  <div>
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-stone-500">{{ item.subtitle }}</p>
                  </div>
                  <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.18em] text-stone-400 uppercase">
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-2"
                  v-html="sectionBodyHtml(section, item)"
                />
              </article>
            </div>
          </section>
        </section>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'professional' || resume.templateId === 'clean'">
      <div class="resume-layout resume-layout--cards">
        <header class="resume-cards-hero">
          <div class="resume-cards-hero__main">
            <div>
              <h1 class="resume-cards-hero__name">{{ displayName }}</h1>
              <p class="resume-cards-hero__title">{{ displayTitle }}</p>
            </div>
            <div class="resume-cards-hero__meta">
              <span v-for="meta in metaLinks" :key="meta">{{ meta }}</span>
            </div>
            <div
              v-if="resume.basics.summaryHtml"
              class="resume-richtext resume-cards-hero__summary"
              v-html="resume.basics.summaryHtml"
            />
          </div>

          <img
            v-if="shouldShowPhoto"
            :src="photoUrl!"
            alt="头像"
            class="resume-cards-hero__photo"
            :class="{ 'order-first': isPhotoLeft, 'order-last': !isPhotoLeft }"
          />
        </header>

        <section class="resume-cards-grid">
          <article v-for="section in orderedSections" :key="section.id" class="resume-panel-card">
            <div class="resume-section-title">
              <component
                :is="sectionIcon(section)"
                v-if="safeStyle.showSectionIcons"
                class="h-[0.95em] w-[0.95em]"
              />
              {{ section.label }}
            </div>
            <div class="mt-4 space-y-4">
              <section v-for="item in section.items" :key="item.id" class="resume-cards-item break-inside-avoid">
                <div
                  class="flex flex-wrap items-start justify-between gap-2"
                  :class="{ 'flex-col !items-start': useStackItemMeta }"
                >
                  <div>
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                  </div>
                  <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.16em] text-stone-400 uppercase">
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-2"
                  v-html="sectionBodyHtml(section, item)"
                />
              </section>
            </div>
          </article>
        </section>
      </div>
    </template>
    <template v-else-if="resume.templateId === 'ats'">
      <div class="resume-layout resume-layout--ats">
        <header class="resume-ats-header">
          <h1 class="resume-ats-header__name">{{ displayName }}</h1>
          <p class="resume-ats-header__title">{{ displayTitle }}</p>
          <p v-if="atsMetaLine" class="resume-ats-meta">{{ atsMetaLine }}</p>
          <div
            v-if="resume.basics.summaryHtml"
            class="resume-richtext resume-ats-header__summary"
            v-html="resume.basics.summaryHtml"
          />
        </header>

        <section class="space-y-[var(--resume-section-gap)]">
          <section v-for="section in orderedSections" :key="section.id" class="resume-section">
            <div class="resume-ats-section-title">{{ section.label }}</div>
            <div class="mt-3 space-y-4">
              <article v-for="item in section.items" :key="item.id" class="resume-ats-item break-inside-avoid">
                <div
                  class="flex flex-wrap items-start justify-between gap-2"
                  :class="{ 'flex-col !items-start': useStackItemMeta }"
                >
                  <div>
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-stone-600">{{ item.subtitle }}</p>
                  </div>
                  <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.1em] text-stone-500 uppercase">
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-2"
                  v-html="sectionBodyHtml(section, item)"
                />
              </article>
            </div>
          </section>
        </section>
      </div>
    </template>
    <template v-else>
      <div class="resume-layout resume-layout--default">
        <header class="resume-header">
          <div class="space-y-4">
            <div
              class="flex flex-wrap items-start gap-6"
              :class="
                shouldCenterBasics
                  ? 'justify-center'
                  : shouldShowPhoto
                    ? 'justify-between'
                    : 'justify-start'
              "
            >
              <img
                v-if="shouldShowPhoto"
                :src="photoUrl!"
                alt="头像"
                class="h-28 aspect-[35/49] rounded-[24px] object-cover ring-1 ring-stone-200"
                :class="{ 'order-first': isPhotoLeft, 'order-last': !isPhotoLeft }"
              />
              <div
                class="space-y-2"
                :class="[
                  { 'order-last': isPhotoLeft, 'order-first': !isPhotoLeft },
                  shouldCenterBasics ? 'text-center' : '',
                ]"
              >
                <div class="text-4xl font-semibold tracking-[-0.04em] text-stone-950">{{ displayName }}</div>
                <div class="text-lg text-[var(--resume-accent)]">{{ displayTitle }}</div>
              </div>
            </div>
            <div
              class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500"
              :class="{ 'justify-center text-center': shouldCenterBasics }"
            >
              <span v-for="meta in metaLinks" :key="meta">{{ meta }}</span>
            </div>
            <div
              v-if="resume.basics.summaryHtml"
              class="resume-richtext max-w-4xl text-sm text-stone-600"
              :class="{ 'mx-auto text-center': shouldCenterBasics }"
              v-html="resume.basics.summaryHtml"
            />
          </div>
        </header>

        <section class="mt-8 space-y-[var(--resume-section-gap)]">
          <section v-for="section in orderedSections" :key="section.id" class="resume-section">
            <div class="resume-section-title">
              <component
                :is="sectionIcon(section)"
                v-if="safeStyle.showSectionIcons"
                class="h-[0.95em] w-[0.95em]"
              />
              {{ section.label }}
            </div>
            <div class="mt-4 space-y-5">
              <article v-for="item in section.items" :key="item.id" class="break-inside-avoid">
                <div
                  class="flex flex-wrap items-start justify-between gap-2"
                  :class="{ 'flex-col !items-start': useStackItemMeta }"
                >
                  <div>
                    <h3 v-if="item.title" class="resume-item-title text-stone-900">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="resume-item-subtitle text-[var(--resume-accent)]">{{ item.subtitle }}</p>
                  </div>
                  <p v-if="renderItemMeta(item)" class="text-xs tracking-[0.16em] text-stone-400 uppercase">
                    {{ renderItemMeta(item) }}
                  </p>
                </div>
                <div
                  v-if="sectionBodyHtml(section, item)"
                  class="resume-richtext mt-3"
                  v-html="sectionBodyHtml(section, item)"
                />
              </article>
            </div>
          </section>
        </section>
      </div>
    </template>
  </article>
</template>
