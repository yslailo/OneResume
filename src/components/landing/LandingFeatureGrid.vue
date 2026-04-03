<script setup lang="ts">
import { computed } from 'vue'
import {
  Download,
  Eye,
  FolderInput,
  LayoutTemplate,
  ShieldCheck,
  Zap,
} from 'lucide-vue-next'
import { landingFeatures } from '@/content/landing'

const iconMap = {
  shield: ShieldCheck,
  bolt: Zap,
  import: FolderInput,
  preview: Eye,
  layout: LayoutTemplate,
  download: Download,
}

const features = computed(() =>
  landingFeatures.map((feature) => ({
    ...feature,
    icon: iconMap[feature.icon],
  })),
)
</script>

<template>
  <section class="landing-section">
    <div class="landing-section__heading">
      <p class="landing-section__eyebrow">核心能力</p>
      <h2 class="landing-section__title">围绕简历这件事，保持足够清晰</h2>
    </div>

    <div class="landing-grid landing-grid--features">
      <article v-for="feature in features" :key="feature.title" class="landing-card landing-card--feature">
        <div class="landing-card__icon">
          <component :is="feature.icon" class="h-4 w-4" />
        </div>
        <h3 class="landing-card__title">{{ feature.title }}</h3>
        <p class="landing-card__description">{{ feature.description }}</p>
      </article>
    </div>
  </section>
</template>
