<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { useFolderTree } from '@/composables/useFolderTree'
import type { TreeNode } from '@explorer/shared'
import { Folder } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  node: TreeNode
  depth: number
}>()

const { selectedFolderId, selectFolder } = useExplorer()
const { isExpanded, toggle } = useFolderTree()

const expanded = computed(() => isExpanded(props.node.id))
const isSelected = computed(() => selectedFolderId.value === props.node.id)
const hasChildren = computed(
  () => props.node.children && props.node.children.length > 0
)

function handleSelect() {
  selectFolder(props.node.id, props.node.name)
}

function handleToggle(e: Event) {
  e.stopPropagation()
  toggle(props.node.id)
}
</script>

<template>
  <div class="tree-node border-l border-transparent">
    <!-- Folder Row -->
    <div
      class="group relative flex cursor-pointer items-center gap-2 py-2 pr-5 transition-all duration-200"
      :class="[
        isSelected
          ? 'bg-bg-active text-text-primary font-medium'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
      ]"
      :style="{ paddingLeft: `${depth * 16 + 20}px` }"
      @click="handleSelect"
    >
      <!-- Active state left border gradient -->
      <div
        v-if="isSelected"
        class="from-accent-cyan to-accent-blue absolute top-0 bottom-0 left-0 w-[3px] bg-linear-to-b"
      ></div>

      <!-- Expand/Collapse Toggle Triangle -->
      <button
        v-if="hasChildren"
        class="-ml-1 flex h-5 w-5 items-center justify-center text-[10px] opacity-70 transition-transform duration-200 hover:opacity-100"
        :class="{ 'rotate-90': expanded }"
        @click="handleToggle"
      >
        ▶
      </button>
      <div v-else class="w-4"></div>

      <!-- Icon -->
      <Folder
        class="h-[18px] w-[18px] shrink-0 opacity-90"
        :class="
          isSelected
            ? 'text-accent-cyan fill-accent-cyan/20'
            : 'text-text-secondary'
        "
      />

      <!-- Name -->
      <span class="truncate text-[13px] leading-tight">
        {{ node.name }}
      </span>
    </div>

    <!-- Recursive Children -->
    <div v-if="expanded && hasChildren">
      <FolderTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>
