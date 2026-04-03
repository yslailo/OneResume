<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpFromLine, Database, FolderInput } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { landingFooterTags } from '@/content/landing'

const iconMap = {
  storage: Database,
  import: FolderInput,
  export: ArrowUpFromLine,
}

const tags = computed(() =>
  landingFooterTags.map((tag) => ({
    ...tag,
    icon: iconMap[tag.icon],
  })),
)
</script>

<template>
  <section class="landing-cta">
    <div class="landing-cta__card">
      <p class="landing-section__eyebrow">开始制作</p>
      <h2 class="landing-cta__title">不需要注册，也不用等待准备环境</h2>
      <p class="landing-cta__subtitle">
        进入工作台后就能直接创建、导入、切模板和导出。界面保持克制，路径保持清晰。
      </p>
      <RouterLink to="/workspace" class="landing-button landing-button--primary">立即开始制作</RouterLink>

      <div class="landing-micro-icons" aria-label="核心能力">
        <div v-for="tag in tags" :key="tag.label" class="landing-micro-icons__item">
          <component :is="tag.icon" class="h-3.5 w-3.5" />
          <span>{{ tag.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
