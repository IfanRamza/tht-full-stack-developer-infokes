<script setup lang="ts">
import ExplorerLayout from './components/layouts/ExplorerLayout.vue'
import ContentPanel from './components/views/content/ContentPanel.vue'
import ErrorBoundary from './components/views/error-boundary/ErrorBoundary.vue'
import StatusBar from './components/views/footer/StatusBar.vue'
import FolderTree from './components/views/sidebar/FolderTree.vue'
import Toolbar from './components/views/toolbar/Toolbar.vue'
</script>

<template>
  <ErrorBoundary>
    <ExplorerLayout>
      <!-- Main Toolbar -->
      <template #toolbar>
        <Toolbar />
      </template>

      <!-- Folder Tree in Sidebar -->
      <template #sidebar>
        <FolderTree />
      </template>

      <!-- Main Content Grid -->
      <template #content>
        <ContentPanel />
      </template>

      <!-- Status Bar -->
      <template #footer>
        <StatusBar />
      </template>
    </ExplorerLayout>
  </ErrorBoundary>
</template>

<style></style>
