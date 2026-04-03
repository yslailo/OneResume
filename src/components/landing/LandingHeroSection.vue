<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="landing-hero">
    <div class="landing-hero__badge">免登录 / 本地优先 / 打开即写</div>
    <h1 class="landing-hero__title">本地优先的极简简历工作台</h1>
    <p class="landing-hero__subtitle">
      用更少的界面噪音完成真正重要的事。OneResume 让你在浏览器里快速整理、预览、切换模板并导出专业简历。
    </p>

    <div class="landing-hero__actions">
      <RouterLink to="/workspace" class="landing-button landing-button--primary">立即开始制作</RouterLink>
    </div>

    <p class="landing-hero__helper">支持导入 PDF / HTML / Markdown / JSON</p>
  </section>
</template>
