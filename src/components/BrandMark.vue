<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 24,
  },
)
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path
      d="M18 10C18 8.89543 18.8954 8 20 8H34L46 20V48C46 49.1046 45.1046 50 44 50H20C18.8954 50 18 49.1046 18 48V10Z"
      fill="#FAFAF9"
    />
    <path d="M34 8V18C34 19.1046 34.8954 20 36 20H46" fill="#D6D3D1" />
    <path d="M24 28H40" stroke="#171717" stroke-width="3" stroke-linecap="round" />
    <path d="M24 35H40" stroke="#171717" stroke-width="3" stroke-linecap="round" />
    <path d="M24 42H34" stroke="#171717" stroke-width="3" stroke-linecap="round" />
    <circle cx="45" cy="45" r="10" fill="#0F766E" />
    <path d="M41 45H49" stroke="#F5F5F4" stroke-width="2.6" stroke-linecap="round" />
    <path d="M45 41V49" stroke="#F5F5F4" stroke-width="2.6" stroke-linecap="round" />
  </svg>
</template>
