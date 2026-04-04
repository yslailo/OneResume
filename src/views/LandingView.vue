<script setup lang="ts">
import LandingCtaSection from '@/components/landing/LandingCtaSection.vue'
import LandingFeatureGrid from '@/components/landing/LandingFeatureGrid.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import LandingHeader from '@/components/landing/LandingHeader.vue'
import LandingHeroSection from '@/components/landing/LandingHeroSection.vue'
import LandingWorkflowSection from '@/components/landing/LandingWorkflowSection.vue'
import LandingSponsorSection from '@/components/landing/LandingSponsorSection.vue'
</script>

<template>
  <div class="landing-shell">
    <div class="landing-shell__glow landing-shell__glow--left" aria-hidden="true"></div>
    <div class="landing-shell__glow landing-shell__glow--right" aria-hidden="true"></div>

    <div class="landing-shell__inner">
      <LandingHeader />
      <main class="landing-main">
        <LandingHeroSection />
        <LandingFeatureGrid />
        <LandingWorkflowSection />
        <LandingSponsorSection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  </div>
</template>
