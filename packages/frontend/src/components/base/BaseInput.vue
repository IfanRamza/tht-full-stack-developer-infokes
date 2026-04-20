<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="modelValue"
    @input="
      $emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
    type="text"
    :placeholder="placeholder"
    class="border-border bg-bg-tertiary text-text-primary focus:border-accent-blue focus:bg-bg-secondary placeholder:text-text-muted block w-full rounded border py-1.5 transition-all focus:outline-none"
    v-bind="$attrs"
  />
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
