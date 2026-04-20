<script setup lang="ts">
import { useResizable } from '@/composables/useResizable'

const { width: sidebarWidth, startDrag } = useResizable(280, 200, 500)
</script>

<template>
  <div
    class="bg-bg-primary text-text-primary flex h-screen flex-col overflow-hidden font-sans"
  >
    <!-- Top Level Toolbar Slot -->
    <slot name="toolbar"></slot>

    <!-- Main Resizable Content -->
    <div class="relative flex flex-1 overflow-hidden">
      <!-- Left Pane (Tree) -->
      <aside
        class="bg-bg-secondary shrink-0 overflow-y-auto"
        :style="{ width: sidebarWidth + 'px' }"
      >
        <div class="py-4">
          <slot name="sidebar"></slot>
        </div>
      </aside>

      <!-- Resize Drag Handle -->
      <div
        class="hover:bg-accent-blue/50 active:bg-accent-blue z-10 w-1 shrink-0 cursor-col-resize bg-transparent transition-colors"
        @mousedown="startDrag"
      ></div>

      <!-- Right Pane (Content) -->
      <main class="bg-bg-primary flex-1 overflow-y-auto">
        <slot name="content"></slot>
      </main>
    </div>

    <!-- Footer Slot -->
    <slot name="footer"></slot>
  </div>
</template>

<style scoped>
aside::-webkit-scrollbar {
  width: 8px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
aside::-webkit-scrollbar-thumb {
  background-color: var(--color-bg-hover);
  border-radius: 4px;
}
aside:hover::-webkit-scrollbar-thumb {
  background-color: var(--color-text-muted);
}
</style>
