<script setup lang="ts">
import { getFileEmoji } from '@/utils/fileIcons'
import { FileText, Folder } from 'lucide-vue-next'

defineProps<{
  type: 'folder' | 'file'
  name: string
  size?: 'sm' | 'lg'
}>()
</script>

<template>
  <!-- Folder Icon -->
  <template v-if="type === 'folder'">
    <Folder
      :class="size === 'lg' ? 'h-12 w-12 stroke-1' : 'h-5 w-5 stroke-2'"
      class="text-accent-cyan fill-accent-cyan/10"
    />
  </template>

  <!-- File Icon -->
  <template v-else>
    <!-- Large: Emoji resolved from lookup map -->
    <span
      v-if="size === 'lg'"
      class="my-1 text-4xl leading-none opacity-90 select-none"
    >
      {{ getFileEmoji(name) }}
    </span>
    <!-- Small: Generic line icon -->
    <FileText v-else class="text-text-muted h-5 w-5 stroke-2" />
  </template>
</template>
