<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResumeDocument } from '@/domain/types'
import ResumeDocumentView from '@/components/ResumeDocument.vue'
import ResumeHtmlFrame from '@/components/ResumeHtmlFrame.vue'
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
  <section class="workbench-panel">
    <div class="workbench-panel__header">
      <div>
        <p class="workbench-panel__eyebrow">
          {{ isSourceHtmlMode ? '原模板预览' : isSyncedHtmlMode ? '模板同步预览' : '实时预览' }}
        </p>
        <h2 class="mt-1 text-sm font-medium text-stone-500">
          {{
            isSourceHtmlMode
              ? '隔离渲染，保留导入模板的原始排版'
              : isSyncedHtmlMode
                ? '继续使用上传模板样式，并按左侧编辑内容实时回填'
                : 'A4 所见即所得，导出与预览保持一致'
          }}
        </h2>
      </div>
      <div class="text-xs font-medium text-stone-500">{{ Math.round(scale * 100) }}%</div>
    </div>

    <div class="workbench-panel__body px-4 py-4 lg:px-8">
      <article
        v-if="(isSourceHtmlMode || isSyncedHtmlMode) && showLocalImageHint"
        class="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        当前 HTML 简历里包含本地磁盘图片路径，浏览器通常无法直接读取这些文件，所以头像可能显示为占位图。
        如果需要完整还原，请把图片改成可访问 URL，或重新在站内上传头像。
      </article>

      <template v-if="isSourceHtmlMode">
        <div class="flex min-h-full items-start justify-center">
          <div class="rounded-[24px] bg-white shadow-[0_24px_60px_rgba(12,10,9,0.08)]" :style="htmlShellStyle">
            <div class="transition-transform duration-300" :style="scaleStyle">
              <ResumeHtmlFrame :html="resume.rawSourceHtml!" @resize="htmlFrameSize = $event" />
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="isSyncedHtmlMode && syncedHtml">
        <div class="flex min-h-full items-start justify-center">
          <div class="rounded-[24px] bg-white shadow-[0_24px_60px_rgba(12,10,9,0.08)]" :style="htmlShellStyle">
            <div class="transition-transform duration-300" :style="scaleStyle">
              <ResumeHtmlFrame :html="syncedHtml" @resize="htmlFrameSize = $event" />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="flex min-h-full items-start justify-center rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_35%),linear-gradient(180deg,#f5f5f4_0%,#ece7e1_100%)] p-4 lg:p-8"
        >
          <div class="transition-transform duration-300" :style="scaleStyle">
            <ResumeDocumentView :resume="resume" :photo-url="photoUrl" />
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
