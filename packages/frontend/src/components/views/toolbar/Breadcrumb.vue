<script setup lang="ts">
import { computed } from 'vue'
import { useExplorer } from '@/composables/useExplorer'

const { selectedFolderPath, selectFolder } = useExplorer()

// Dynamic string-based breadcrumb builder
const breadcrumbs = computed(() => {
  const root = { name: 'This PC', path: '' }
  if (!selectedFolderPath.value) return [root]
  
  const segments = selectedFolderPath.value.split('/').filter(Boolean)
  let currentPath = ''
  const crumbs = [root]
  
  for (const seg of segments) {
    currentPath += currentPath ? `/${seg}` : seg
    crumbs.push({ name: seg, path: currentPath })
  }
  return crumbs
})
</script>

<template>
  <div class="flex items-center text-sm">
    <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.path">
      <span class="text-text-secondary mx-1" v-if="idx > 0">›</span>
      <span
        class="hover:text-accent-cyan cursor-pointer transition-colors"
        :class="{
          'text-text-primary font-medium': idx === breadcrumbs.length - 1,
          'text-text-secondary': idx !== breadcrumbs.length - 1,
        }"
        @click="selectFolder(crumb.path)"
      >
        {{ crumb.name }}
      </span>
    </template>
  </div>
</template>
