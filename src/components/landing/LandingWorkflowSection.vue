<script setup lang="ts">
import { landingSteps, landingTemplateCards } from '@/content/landing'
</script>

<template>
  <section class="landing-section landing-section--split">
    <div class="landing-panel">
      <div class="landing-section__heading">
        <p class="landing-section__eyebrow">开始路径</p>
        <h2 class="landing-section__title">从旧简历到新排版，只保留必要步骤</h2>
      </div>

      <div class="landing-step-list">
        <article v-for="step in landingSteps" :key="step.index" class="landing-step">
          <span class="landing-step__index">{{ step.index }}</span>
          <div>
            <h3 class="landing-step__title">{{ step.title }}</h3>
            <p class="landing-step__description">{{ step.description }}</p>
          </div>
        </article>
      </div>
    </div>

    <div class="landing-panel landing-panel--templates">
      <div class="landing-section__heading">
        <p class="landing-section__eyebrow">模板观感</p>
        <h2 class="landing-section__title">清爽、专业、适合正式投递</h2>
      </div>

      <div class="landing-template-stack">
        <article
          v-for="template in landingTemplateCards"
          :key="template.name"
          class="landing-template-card"
          :class="`landing-template-card--${template.accent}`"
        >
          <div class="landing-template-card__paper">
            <div class="landing-template-card__bar"></div>
            <div class="landing-template-card__line landing-template-card__line--short"></div>
            <div class="landing-template-card__line"></div>
            <div class="landing-template-card__line landing-template-card__line--muted"></div>
            <div class="landing-template-card__line"></div>
            <div class="landing-template-card__line landing-template-card__line--short"></div>
          </div>
          <div class="landing-template-card__meta">
            <h3>{{ template.name }}</h3>
            <p>{{ template.tone }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
