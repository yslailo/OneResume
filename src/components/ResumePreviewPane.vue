<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResumeDocument } from '@/domain/types'
import ResumeDocumentView from '@/components/ResumeDocument.vue'
import ResumeHtmlFrame from '@/components/ResumeHtmlFrame.vue'
import { findResumeTemplate } from '@/domain/templates'
import { renderResumeIntoHtmlTemplate } from '@/persistence/htmlTemplateSync'

const props = defineProps<{
  resume: ResumeDocument
  photoUrl: string | null
  scale: number
  showLocalImageHint: boolean
}>()

const htmlFrameSize = ref({
  width: 820,
  height: 1122,
})

const currentTemplateLabel = computed(() => findResumeTemplate(props.resume.templateId).label)

const scaleStyle = computed(() => ({
  transform: `scale(${props.scale})`,
  transformOrigin: 'top center',
}))

const isSourceHtmlMode = computed(
  () => props.resume.previewMode === 'source-html' && props.resume.sourceFormat === 'html' && Boolean(props.resume.rawSourceHtml),
)

const isSyncedHtmlMode = computed(
  () =>
    props.resume.previewMode === 'source-html-sync' &&
    props.resume.sourceFormat === 'html' &&
    Boolean(props.resume.rawSourceHtml),
)

const syncedHtml = computed(() =>
  isSyncedHtmlMode.value && props.resume.rawSourceHtml
    ? renderResumeIntoHtmlTemplate(props.resume.rawSourceHtml, props.resume, props.photoUrl)
    : null,
)

const htmlShellStyle = computed(() => ({
  width: `${htmlFrameSize.value.width * props.scale}px`,
  minHeight: `${htmlFrameSize.value.height * props.scale}px`,
}))
</script>

<template>
  <section class="workbench-panel preview-panel">
    <div class="workbench-panel__header">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-stone-900">简历预览</h2>
      </div>
      <div class="preview-panel__header-meta">
        <span class="preview-panel__template-badge">当前模板：{{ currentTemplateLabel }}</span>
      </div>
    </div>

    <div class="workbench-panel__body preview-panel__body">
      <article
        v-if="(isSourceHtmlMode || isSyncedHtmlMode) && showLocalImageHint"
        class="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        当前 HTML 简历里包含本地磁盘图片路径，浏览器通常无法直接读取这些文件，所以头像可能显示为占位图。
        如果需要完整还原，请把图片改成可访问 URL，或重新在站内上传头像。
      </article>

      <template v-if="isSourceHtmlMode">
        <div class="preview-panel__viewport">
          <div class="flex items-start justify-center">
            <div class="rounded-[28px] bg-white shadow-[0_20px_52px_rgba(12,10,9,0.08)]" :style="htmlShellStyle">
              <div class="transition-transform duration-300" :style="scaleStyle">
                <ResumeHtmlFrame :html="resume.rawSourceHtml!" @resize="htmlFrameSize = $event" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="isSyncedHtmlMode && syncedHtml">
        <div class="preview-panel__viewport">
          <div class="flex items-start justify-center">
            <div class="rounded-[28px] bg-white shadow-[0_20px_52px_rgba(12,10,9,0.08)]" :style="htmlShellStyle">
              <div class="transition-transform duration-300" :style="scaleStyle">
                <ResumeHtmlFrame :html="syncedHtml" @resize="htmlFrameSize = $event" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="preview-panel__viewport">
          <div class="preview-stage">
            <div class="preview-stage__sheet transition-transform duration-300" :style="scaleStyle">
              <ResumeDocumentView :resume="resume" :photo-url="photoUrl" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
