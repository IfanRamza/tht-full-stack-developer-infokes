<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { formatDate, formatSize } from '@/utils/formatters'
import type { Item } from '@explorer/shared'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'
import FileIcon from '../../base/FileIcon.vue'

const props = defineProps<{
  item: Item
  viewMode?: 'grid' | 'list'
  showLocation?: boolean
}>()

const emit = defineEmits<{
  delete: []
  rename: [newName: string]
}>()

const isFolder = computed(() => props.item.type === 'folder')
const mode = computed(() => props.viewMode || 'grid')

const { selectFolder, selectedFolderPath, getHumanReadableLocation } = useExplorer()

// ── Navigation ────────────────────────────────────────────────────────────
const handleNavigate = () => {
  if (isFolder.value && !isRenaming.value) {
    const itemPath = selectedFolderPath.value
      ? `${selectedFolderPath.value}/${props.item.name}`
      : props.item.name
    selectFolder(itemPath)
  }
}

// ── Rename ────────────────────────────────────────────────────────────────
const isRenaming = ref(false)
const renameValue = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

async function startRename(e: MouseEvent) {
  e.stopPropagation()
  isRenaming.value = true
  renameValue.value = props.item.name
  await nextTick()
  renameInput.value?.select()
}

function cancelRename() {
  isRenaming.value = false
}

function confirmRename() {
  const trimmed = renameValue.value.trim()
  if (trimmed && trimmed !== props.item.name) {
    emit('rename', trimmed)
  }
  isRenaming.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  if (confirm(`Delete "${props.item.name}"? This cannot be undone.`)) {
    emit('delete')
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

    <!-- Hover Action Buttons (top-right corner) -->
    <div
      class="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        :id="`rename-btn-${item.id}`"
        class="rounded p-1 text-text-muted hover:bg-bg-active hover:text-accent-cyan transition-colors"
        title="Rename"
        @click="startRename"
      >
        <Pencil class="h-3 w-3" />
      </button>
      <button
        :id="`delete-btn-${item.id}`"
        class="rounded p-1 text-text-muted hover:bg-bg-active hover:text-red-400 transition-colors"
        title="Delete"
        @click="handleDelete"
      >
        <Trash2 class="h-3 w-3" />
      </button>
    </div>

    <!-- Icon Container -->
    <div class="mb-3 flex items-center justify-center">
      <FileIcon :type="item.type" :name="item.name" size="lg" />
    </div>

    <!-- Metadata -->
    <div
      class="z-10 flex w-full flex-col items-center gap-0.5 px-1 text-center"
    >
      <!-- Inline rename input -->
      <input
        v-if="isRenaming"
        ref="renameInput"
        v-model="renameValue"
        class="w-full rounded bg-bg-active px-1 text-center text-[13px] text-text-primary outline-none ring-1 ring-accent-cyan"
        @keyup.enter="confirmRename"
        @keyup.esc="cancelRename"
        @blur="cancelRename"
        @click.stop
      />
      <span
        v-else
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

    <!-- Name (or inline rename input) -->
    <div
      class="text-text-primary flex-1 truncate pr-4 text-[13px] font-medium"
      :class="showLocation ? 'min-w-[150px]' : 'min-w-[200px]'"
    >
      <input
        v-if="isRenaming"
        ref="renameInput"
        v-model="renameValue"
        class="w-full rounded bg-bg-active px-1 text-[13px] text-text-primary outline-none ring-1 ring-accent-cyan"
        @keyup.enter="confirmRename"
        @keyup.esc="cancelRename"
        @blur="cancelRename"
        @click.stop
      />
      <span v-else>{{ item.name }}</span>
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

    <!-- Hover Action Buttons (far right) -->
    <div
      class="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        :id="`rename-list-btn-${item.id}`"
        class="rounded p-1 text-text-muted hover:bg-bg-active hover:text-accent-cyan transition-colors"
        title="Rename"
        @click="startRename"
      >
        <Pencil class="h-3.5 w-3.5" />
      </button>
      <button
        :id="`delete-list-btn-${item.id}`"
        class="rounded p-1 text-text-muted hover:bg-bg-active hover:text-red-400 transition-colors"
        title="Delete"
        @click="handleDelete"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>
