<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'
import { onErrorCaptured, ref } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  // Prevent propagation
  return false
})

function retry() {
  error.value = null
}
</script>

<template>
  <div
    v-if="error"
    class="bg-bg-primary animate-in fade-in zoom-in flex h-full w-full flex-col items-center justify-center p-8 text-center duration-300"
  >
    <div
      class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10"
    >
      <AlertTriangle class="h-12 w-12 text-red-500" />
    </div>
    <h2 class="text-text-primary mb-2 text-2xl font-bold tracking-tight">
      Something went wrong
    </h2>
    <p class="text-text-secondary mb-8 max-w-md text-sm">
      {{
        error.message ||
        'An unexpected error occurred while rendering the application.'
      }}
    </p>
    <BaseButton variant="primary" @click="retry">
      <RefreshCw class="h-4 w-4" />
      Try Again
    </BaseButton>
  </div>
  <slot v-else></slot>
</template>
