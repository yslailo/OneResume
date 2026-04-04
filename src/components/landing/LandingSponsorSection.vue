<script setup lang="ts">
interface SponsorEntry {
  name: string
  date: string
  message?: string
}

const sponsors: SponsorEntry[] = [
  {
    name: 'zzz',
    message: '我将全力推荐给我班的同学',
    date: '2026-04',
  },
]
</script>

<template>
  <section v-if="sponsors.length > 0" class="landing-section landing-section--sponsors">
    <div class="landing-sponsor__intro">
      <div class="landing-section__heading">
        <p class="landing-section__eyebrow">特别鸣谢</p>
        <h2 class="landing-section__title">感谢正在支持 OneResume 的朋友</h2>
        <p class="landing-sponsor__description">
          这份名单会持续更新。每一次赞助和推荐，都会直接变成这个项目继续打磨与迭代的动力。
        </p>
      </div>

      <div class="landing-sponsor__summary" aria-label="赞助概览">
        <span class="landing-sponsor__summary-value">{{ sponsors.length }}</span>
        <span class="landing-sponsor__summary-label">位赞助者</span>
        <p class="landing-sponsor__summary-note">感谢你们为开源项目留出的一份支持。</p>
      </div>
    </div>

    <div class="landing-sponsor__list">
      <article
        v-for="(sponsor, index) in sponsors"
        :key="`${sponsor.name}-${index}`"
        class="landing-sponsor-card"
      >
        <div class="landing-sponsor-card__meta">
          <div>
            <p class="landing-sponsor-card__name">{{ sponsor.name }}</p>
            <p class="landing-sponsor-card__tag">支持 OneResume</p>
          </div>
          <span class="landing-sponsor-card__date">{{ sponsor.date }}</span>
        </div>

        <p v-if="sponsor.message" class="landing-sponsor-card__message">
          {{ sponsor.message }}
        </p>
      </article>
    </div>
  </section>
</template>
