<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { useSearch } from '@/composables/useSearch'
import { computed } from 'vue'

const { children } = useExplorer()
const { searchQuery, searchResults } = useSearch()

const displayItems = computed(() => {
  return searchQuery.value.trim() ? searchResults.value : children.value
})

const totalVisibleSize = computed(() => {
  let size = 0
  for (const item of displayItems.value) {
    size += Number(item.size) || 0
  }
  if (size === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
})
</script>

<template>
  <footer
    class="border-border bg-bg-secondary text-text-secondary flex h-7 shrink-0 items-center justify-between border-t px-4 font-mono text-[11px]"
  >
    <div>{{ displayItems.length }} items</div>
    <div>{{ totalVisibleSize }} total size</div>
  </footer>
</template>
