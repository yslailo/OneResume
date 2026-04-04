<script setup lang="ts">
import { ref } from 'vue'

// ==========================================
// 在这里自行添加或调整赞助人名单
// ==========================================
const sponsors = ref([
  // 示例格式，您可以直接修改内容或新增行
  { name: 'zzz', message: '我将全推给我班的同学', date: '2026-04' },
])
</script>

<template>
  <section class="py-20 px-6 max-w-6xl mx-auto w-full relative z-10" v-if="sponsors.length > 0">
    <div class="landing-section__heading text-center">
      <p class="landing-section__eyebrow">特别鸣谢</p>
      <h2 class="landing-section__title">项目赞助者</h2>
      <p class="mt-4 text-sm text-stone-500 max-w-xl mx-auto">
        感谢以下朋友对 OneResume 开源项目的支持，你们的鼓励是项目持续迭代的动力。
      </p>
    </div>

    <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div v-for="(sponsor, index) in sponsors" :key="index" class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm transition hover:shadow-md hover:border-stone-300">
        <div class="flex justify-between items-center mb-3">
          <span class="font-medium text-stone-900">{{ sponsor.name }}</span>
          <span class="text-xs text-stone-400 tabular-nums">{{ sponsor.date }}</span>
        </div>
        <p v-if="sponsor.message" class="text-sm text-stone-600 leading-relaxed italic">
          "{{ sponsor.message }}"
        </p>
      </div>
    </div>
  </section>
</template>
