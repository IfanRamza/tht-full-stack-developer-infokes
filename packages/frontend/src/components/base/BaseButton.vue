<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'icon'
    disabled?: boolean
  }>(),
  {
    variant: 'ghost',
    disabled: false,
  }
)

const baseClasses =
  'inline-flex items-center justify-center transition-colors focus:outline-none cursor-pointer disabled:cursor-not-allowed'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-accent-blue hover:bg-accent-blue/80 text-white rounded-md px-6 py-2.5 text-sm font-medium focus:ring-4 focus:ring-accent-blue/20'
    case 'icon':
      return 'rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary h-8 w-8 disabled:opacity-30'
    case 'ghost':
    default:
      return 'rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-hover'
  }
})
</script>

<template>
  <button
    :class="[baseClasses, variantClasses]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
