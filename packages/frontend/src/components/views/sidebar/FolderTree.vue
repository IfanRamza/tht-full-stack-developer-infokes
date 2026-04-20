<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { AlertTriangle } from 'lucide-vue-next'
import FolderTreeNode from './FolderTreeNode.vue'

const { tree, isTreeLoading, treeError } = useExplorer()
</script>

<template>
  <div class="folder-tree h-full select-none">
    <!-- Loading State -->
    <div
      v-if="isTreeLoading"
      class="text-text-muted flex items-center gap-2 px-5 py-2 text-sm"
    >
      <div
        class="border-accent-cyan h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
      ></div>
      <span>Loading folders...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="treeError" class="flex items-start gap-2 px-5 py-2 text-[13px] text-red-400">
      <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
      <span class="leading-tight">{{ treeError }}</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tree.length === 0"
      class="text-text-muted px-5 py-2 text-sm italic"
    >
      No folders found.
    </div>

    <!-- Tree Nodes -->
    <div v-else class="flex flex-col">
      <FolderTreeNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        current-path=""
      />
    </div>
  </div>
</template>
