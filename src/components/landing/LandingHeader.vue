<script setup lang="ts">
import BrandMark from '@/components/BrandMark.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="landing-shell__header">
    <div class="landing-shell__brand">
      <div class="landing-brand__mark" aria-hidden="true">
        <BrandMark :size="24" />
      </div>
      <div>
        <p class="landing-brand__name">OneResume</p>
        <p class="landing-brand__meta">本地优先简历工作台</p>
      </div>
    </div>

    <RouterLink to="/workspace" class="landing-button landing-button--ghost">进入工作台</RouterLink>
  </header>
</template>
