<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HardDrive,
} from 'lucide-vue-next'
import { computed } from 'vue'
import SearchBar from './SearchBar.vue'

const { tree, selectedFolderId } = useExplorer()

// Recursive breadcrumb builder
const breadcrumbs = computed(() => {
  if (!selectedFolderId.value) return ['This PC']
  const path: string[] = []

  const findPath = (nodes: any[], targetId: string): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.unshift(node.name)
        return true
      }
      if (node.children && findPath(node.children, targetId)) {
        path.unshift(node.name)
        return true
      }
    }
    return false
  }

  findPath(tree.value, selectedFolderId.value)
  return ['This PC', ...path]
})
</script>

<template>
  <header
    class="border-border bg-bg-secondary z-10 flex h-14 shrink-0 items-center border-b px-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
  >
    <!-- Window Nav Controls -->
    <div class="mr-4 flex items-center gap-1">
      <button
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <button
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30"
        disabled
      >
        <ChevronRight class="h-5 w-5" />
      </button>
      <button
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30"
      >
        <ChevronUp class="h-5 w-5" />
      </button>
    </div>

    <!-- Breadcrumbs Path -->
    <div
      class="border-border bg-bg-tertiary hover:border-text-muted mr-4 flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 transition-colors"
    >
      <HardDrive class="text-accent-cyan h-4 w-4" />
      <div class="flex items-center text-sm">
        <template v-for="(crumb, idx) in breadcrumbs" :key="crumb">
          <span class="text-text-secondary mx-1" v-if="idx > 0">›</span>
          <span
            class="hover:text-accent-cyan cursor-pointer transition-colors"
            :class="{
              'text-text-primary font-medium': idx === breadcrumbs.length - 1,
              'text-text-secondary': idx !== breadcrumbs.length - 1,
            }"
          >
            {{ crumb }}
          </span>
        </template>
      </div>
    </div>

    <!-- Search Box -->
    <div class="w-64">
      <SearchBar />
    </div>
  </header>
</template>
