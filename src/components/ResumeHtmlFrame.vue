<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  html: string
  mode?: 'preview' | 'print'
  autoPrint?: boolean
  documentTitle?: string
}>()

const emit = defineEmits<{
  (event: 'resize', payload: { width: number; height: number }): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let resizeObserver: ResizeObserver | null = null
let scheduledFrame: number | null = null

const srcdoc = computed(() => {
  const normalizedHtml = props.html.replace(/src="([A-Za-z]):\\/g, 'src="file:///$1:/').replace(/\\/g, '/')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${props.documentTitle ?? 'resume.pdf'}</title>
    <base target="_blank" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: white;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      img {
        max-width: 100%;
      }
    </style>
  </head>
  <body>${normalizedHtml}</body>
</html>`
})

function syncFrameMetrics(): void {
  const iframe = iframeRef.value
  const document = iframe?.contentDocument
  if (!iframe || !document) {
    return
  }

  const bodyHeight = document.body.scrollHeight
  const htmlHeight = document.documentElement.scrollHeight
  const bodyWidth = document.body.scrollWidth
  const htmlWidth = document.documentElement.scrollWidth
  const nextHeight = Math.max(bodyHeight, htmlHeight, 1122)
  const nextWidth = Math.max(bodyWidth, htmlWidth, 794)

  iframe.style.height = `${nextHeight}px`
  iframe.style.width = `${nextWidth}px`
  emit('resize', { width: nextWidth, height: nextHeight })
}

function queueSync(): void {
  if (scheduledFrame !== null) {
    cancelAnimationFrame(scheduledFrame)
  }
  scheduledFrame = requestAnimationFrame(() => {
    syncFrameMetrics()
    scheduledFrame = null
  })
}

function bindFrameObservers(): void {
  const iframe = iframeRef.value
  const document = iframe?.contentDocument
  if (!iframe || !document) {
    return
  }

  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    queueSync()
  })

  resizeObserver.observe(document.documentElement)
  resizeObserver.observe(document.body)

  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('load', queueSync)
    image.addEventListener('error', queueSync)
  })

  iframe.contentWindow?.addEventListener('resize', queueSync)
}

async function waitForFrameImages(): Promise<void> {
  const document = iframeRef.value?.contentDocument
  if (!document) {
    return
  }

  const images = Array.from(document.images).filter((image) => !image.complete)
  if (images.length === 0) {
    return
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )
}

async function handleLoad(): Promise<void> {
  await nextTick()
  bindFrameObservers()
  queueSync()

  if (props.autoPrint && iframeRef.value?.contentWindow) {
    await waitForFrameImages()
    window.setTimeout(() => {
      iframeRef.value?.contentWindow?.focus()
      iframeRef.value?.contentWindow?.print()
    }, 180)
  }
}

watch(
  () => props.html,
  async () => {
    await nextTick()
    queueSync()
  },
)

onMounted(() => {
  queueSync()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (scheduledFrame !== null) {
    cancelAnimationFrame(scheduledFrame)
  }
})
</script>

<template>
  <iframe
    ref="iframeRef"
    :srcdoc="srcdoc"
    class="resume-html-frame"
    :class="{ 'resume-html-frame--print': mode === 'print' }"
    title="HTML 简历预览"
    sandbox="allow-same-origin allow-popups allow-modals"
    @load="handleLoad"
  />
</template>
