<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { formatDate, formatSize } from '@/utils/formatters'
import type { Item } from '@explorer/shared'
import { computed } from 'vue'
import FileIcon from '../../base/FileIcon.vue'

const props = defineProps<{
  item: Item
  viewMode?: 'grid' | 'list'
  showLocation?: boolean
}>()

const isFolder = computed(() => props.item.type === 'folder')
const mode = computed(() => props.viewMode || 'grid')

const { selectFolder, selectedFolderPath, getHumanReadableLocation } = useExplorer()

const handleNavigate = () => {
  if (isFolder.value) {
    const itemPath = selectedFolderPath.value
      ? `${selectedFolderPath.value}/${props.item.name}`
      : props.item.name
    selectFolder(itemPath)
  }
}
</script>

<template>
  <!-- Grid View -->
  <div
    v-if="mode === 'grid'"
    @dblclick="handleNavigate"
    class="group bg-bg-secondary hover:border-accent-blue/50 relative flex cursor-pointer flex-col overflow-hidden rounded border border-transparent p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
  >
    <!-- Hover Shim Gradient -->
    <div
      class="from-accent-blue to-accent-cyan pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity group-hover:opacity-[0.03]"
    ></div>

    <!-- Icon Container -->
    <div class="mb-3 flex items-center justify-center">
      <FileIcon :type="item.type" :name="item.name" size="lg" />
    </div>

    <!-- Metadata -->
    <div
      class="z-10 flex w-full flex-col items-center gap-0.5 px-1 text-center"
    >
      <span
        class="text-text-primary w-full truncate text-[13px] leading-tight font-medium"
      >
        {{ item.name }}
      </span>
      <span class="text-text-muted mt-1 font-mono text-[11px] opacity-70">
        {{ isFolder ? 'Folder' : formatSize(item.size) }}
      </span>
    </div>
  </div>

  <!-- List View -->
  <div
    v-else
    @dblclick="handleNavigate"
    class="group border-border/50 hover:bg-bg-hover relative flex cursor-pointer items-center border-b px-4 py-2 transition-colors"
  >
    <!-- Icon -->
    <div class="mr-3 flex w-8 items-center justify-center">
      <FileIcon :type="item.type" :name="item.name" size="sm" />
    </div>

    <!-- Name -->
    <div
      class="text-text-primary flex-1 truncate pr-4 text-[13px] font-medium"
      :class="showLocation ? 'min-w-[150px]' : 'min-w-[200px]'"
    >
      {{ item.name }}
    </div>

    <!-- Location -->
    <div
      v-if="showLocation"
      class="text-text-secondary flex-1 min-w-[150px] truncate pr-4 text-[12px] opacity-70 hover:opacity-100"
      :title="getHumanReadableLocation(item.path)"
    >
      {{ getHumanReadableLocation(item.path) }}
    </div>

    <!-- Date Modified -->
    <div
      class="text-text-secondary w-[160px] shrink-0 truncate pr-4 text-[12px] capitalize"
    >
      {{ formatDate(item.updatedAt) }}
    </div>

    <!-- Type -->
    <div
      class="text-text-secondary w-[120px] shrink-0 truncate pr-4 font-mono text-[12px]"
    >
      {{ isFolder ? 'File Folder' : item.name.split('.').pop() + ' File' }}
    </div>

    <!-- Size -->
    <div class="text-text-secondary w-[100px] shrink-0 truncate text-right text-[12px]">
      {{ isFolder ? '' : formatSize(item.size) }}
    </div>
  </div>
</template>
