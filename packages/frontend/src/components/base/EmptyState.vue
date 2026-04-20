<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon: Component
    title: string
    description?: string
    // Color configuration: default is muted/gray, primary is blue, danger is red
    theme?: 'default' | 'primary' | 'danger'
    animateIcon?: boolean
  }>(),
  {
    theme: 'default',
    animateIcon: false,
  }
)
</script>

<template>
  <div
    class="animate-in fade-in flex h-full flex-col items-center justify-center py-20 text-center duration-300"
  >
    <div
      class="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
      :class="{
        'bg-bg-active text-text-muted': theme === 'default',
        'bg-accent-blue/10 text-accent-blue': theme === 'primary',
        'bg-red-500/10 text-red-500': theme === 'danger',
      }"
    >
      <component
        :is="icon"
        class="h-12 w-12"
        :class="{
          'animate-pulse': animateIcon,
          'opacity-60': theme === 'default' && !animateIcon,
        }"
      />
    </div>
    <h3 class="text-text-primary text-xl font-medium tracking-tight">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-2 max-w-[320px] text-sm leading-relaxed"
      :class="theme === 'danger' ? 'text-red-400' : 'text-text-muted'"
    >
      {{ description }}
    </p>
  </div>
</template>
