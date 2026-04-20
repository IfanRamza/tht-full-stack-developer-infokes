<script setup lang="ts">
import { useExplorer } from '@/composables/useExplorer'
import { useSearch } from '@/composables/useSearch'
import { FolderOpen, LayoutGrid, List, Search, SearchX } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import GridSkeleton from '../skeleton/GridSkeleton.vue'
import ListSkeleton from '../skeleton/ListSkeleton.vue'
import ContentItem from './ContentItem.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { children, isChildrenLoading, selectedFolderId, selectedFolderName } =
  useExplorer()
const { searchResults, isSearching, searchQuery } = useSearch()

const viewMode = ref<'grid' | 'list'>('grid')

const itemsToDisplay = computed(() => {
  if (searchQuery.value.trim()) return searchResults.value
  return children.value
})

const isLoading = computed(() => {
  if (searchQuery.value.trim()) return isSearching.value
  return isChildrenLoading.value
})

const displayTitle = computed(() => {
  if (searchQuery.value.trim()) return `Search Results in "This PC"`
  return selectedFolderName.value || 'Home'
})
</script>

<template>
  <div class="content-panel flex h-full min-h-[400px] flex-col p-4">
    <!-- View Header (Active Folder Title + Controls) -->
    <div
      class="border-border/50 mb-6 flex items-center justify-between border-b pb-2"
    >
      <h2 class="text-text-primary text-xl font-semibold tracking-tight">
        {{ displayTitle }}
      </h2>
      <div
        class="bg-bg-secondary border-border flex items-center gap-1 rounded-md border p-1"
      >
        <BaseButton
          variant="ghost"
          :class="{ 'bg-bg-active text-text-primary shadow-sm': viewMode === 'grid' }"
          title="Grid View"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="h-4 w-4" />
        </BaseButton>
        <BaseButton
          variant="ghost"
          :class="{ 'bg-bg-active text-text-primary shadow-sm': viewMode === 'list' }"
          title="List View"
          @click="viewMode = 'list'"
        >
          <List class="h-4 w-4" />
        </BaseButton>
      </div>
    </div>

    <!-- Main Lists -->
    <div class="flex-1">
      <!-- Search No Result State -->
      <div
        v-if="searchQuery && !isLoading && itemsToDisplay.length === 0"
        class="flex h-full flex-col items-center justify-center py-20 text-center"
      >
        <div
          class="bg-bg-active text-text-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full"
        >
          <SearchX class="h-10 w-10 opacity-50" />
        </div>
        <h3 class="text-text-primary text-lg font-medium">
          No results for "{{ searchQuery }}"
        </h3>
        <p class="text-text-muted mt-2 max-w-[240px] text-sm">
          Try checking for typos or searching for a different keyword.
        </p>
      </div>

      <!-- No Selection State (Only show if not searching) -->
      <div
        v-else-if="!selectedFolderId && !searchQuery"
        class="flex h-full flex-col items-center justify-center py-20 text-center"
      >
        <div
          class="bg-accent-blue/10 text-accent-blue mb-5 flex h-24 w-24 items-center justify-center rounded-full"
        >
          <FolderOpen class="h-12 w-12" />
        </div>
        <h3 class="text-text-primary text-xl font-medium">Select a folder</h3>
        <p class="text-text-secondary mt-3 max-w-[280px] text-sm">
          Click on any directory from the left sidebar to view its contents.
        </p>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading">
        <!-- Search Loading State -->
        <div
          v-if="searchQuery.trim()"
          class="animate-in fade-in flex h-full flex-col items-center justify-center py-20 text-center duration-300"
        >
          <div
            class="bg-accent-blue/5 mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          >
            <Search class="text-accent-blue h-12 w-12 animate-pulse" />
          </div>
          <h3 class="text-text-primary text-xl font-medium tracking-tight">
            Searching...
          </h3>
          <p class="text-text-muted mt-2 max-w-[260px] text-sm">
            Looking for "{{ searchQuery }}" across your files...
          </p>
        </div>

        <!-- Folder Loading State (Skeletons) -->
        <template v-else>
          <!-- Grid Skeleton -->
          <GridSkeleton v-if="viewMode === 'grid'" />
          <!-- List Skeleton -->
          <ListSkeleton v-else />
        </template>
      </div>

      <!-- Empty Folder State (Only show if not searching) -->
      <div
        v-else-if="itemsToDisplay.length === 0 && !searchQuery"
        class="text-text-muted flex h-full flex-col items-center justify-center py-20"
      >
        <p class="text-md bg-bg-secondary rounded px-4 py-2 font-medium">
          This folder is empty.
        </p>
      </div>

      <!-- Content Grid/List -->
      <div v-else>
        <!-- List Header -->
        <div
          v-if="viewMode === 'list'"
          class="border-border text-text-secondary mb-1 flex items-center border-b px-4 py-2 text-[11px] font-semibold tracking-wider uppercase"
        >
          <div class="mr-3 w-8"></div>
          <!-- icon space -->
          <div class="w-[200px] flex-1 pr-4">Name</div>
          <div class="w-[200px] pr-4">Date modified</div>
          <div class="w-[120px] pr-4">Type</div>
          <div class="w-[100px] text-right">Size</div>
        </div>

        <!-- Render Items -->
        <div
          :class="[
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'flex flex-col',
          ]"
        >
          <ContentItem
            v-for="item in itemsToDisplay"
            :key="item.id"
            :item="item"
            :view-mode="viewMode"
          />
        </div>
      </div>
    </div>
  </div>
</template>
