<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'
import ResumeDocument from '@/components/ResumeDocument.vue'
import BrandMark from '@/components/BrandMark.vue'
import { createExampleResume } from '@/domain/resume'
import { isResumeTemplateId, resumeTemplates } from '@/domain/templates'

const route = useRoute()

const isFromWorkspace = computed(() => route.query.from === 'workspace')
const selectedResumeId = computed(() =>
  typeof route.query.resumeId === 'string' ? route.query.resumeId : undefined,
)
const currentTemplate = computed(() =>
  isResumeTemplateId(route.query.current) ? route.query.current : null,
)

const previewResumes = computed(() =>
  resumeTemplates.map((template) => {
    const resume = createExampleResume()
    resume.templateId = template.id

    return {
      template,
      resume,
    }
  }),
)

const workspaceBackLink = computed(() => ({
  name: 'workspace',
  query: selectedResumeId.value ? { resumeId: selectedResumeId.value } : undefined,
}))

function workspaceLink(templateId: string) {
  return {
    name: 'workspace',
    query: {
      template: templateId,
      ...(selectedResumeId.value ? { resumeId: selectedResumeId.value } : {}),
    },
  }
}
</script>

<template>
  <div class="template-gallery-shell">
    <div class="template-gallery-shell__inner">
      <header class="template-gallery-header">
        <div class="template-gallery-header__brand">
          <div class="landing-brand__mark">
            <BrandMark :size="24" />
          </div>
          <div>
            <p class="landing-brand__name">OneResume</p>
            <p class="landing-brand__meta">模板库</p>
          </div>
        </div>

        <div class="template-gallery-header__actions">
          <div class="template-gallery-header__copy">
            <p class="landing-section__eyebrow">Template Library</p>
            <h1 class="template-gallery-header__title">选择模板</h1>
          </div>

          <RouterLink v-if="isFromWorkspace" :to="workspaceBackLink" class="landing-button landing-button--ghost">
            <ArrowLeft class="h-4 w-4" />
            返回工作台
          </RouterLink>
        </div>
      </header>

      <section class="template-gallery-grid">
        <RouterLink
          v-for="entry in previewResumes"
          :key="entry.template.id"
          :to="workspaceLink(entry.template.id)"
          class="template-gallery-card"
          :class="{ 'template-gallery-card--active': currentTemplate === entry.template.id }"
        >
          <div class="template-gallery-card__top">
            <h2 class="template-gallery-card__title">{{ entry.template.label }}</h2>
            <span v-if="currentTemplate === entry.template.id" class="template-gallery-card__badge">
              <Check class="h-3.5 w-3.5" />
              当前
            </span>
          </div>

          <div class="template-gallery-card__preview-shell">
            <div class="template-gallery-card__preview-scale">
              <ResumeDocument :resume="entry.resume" :photo-url="null" mode="print" />
            </div>
          </div>
        </RouterLink>
      </section>
    </div>
  </div>
</template>
