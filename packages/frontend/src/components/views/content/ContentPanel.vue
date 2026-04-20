<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { useExplorer } from '@/composables/useExplorer'
import { useSearch } from '@/composables/useSearch'
import { sortItems } from '@/utils/sort'
import {
  AlertTriangle,
  FolderOpen,
  LayoutGrid,
  List,
  Search,
  SearchX,
} from 'lucide-vue-next'
import { computed, onUnmounted, ref, watch } from 'vue'
import GridSkeleton from '../skeleton/GridSkeleton.vue'
import ListSkeleton from '../skeleton/ListSkeleton.vue'
import ContentItem from './ContentItem.vue'

const {
  children,
  isChildrenLoading,
  isChildrenLoadingMore,
  hasMoreChildren,
  loadMoreChildren,
  selectedFolderPath,
  selectedFolderName,
  contentError,
} = useExplorer()
const { searchResults, isSearching, searchQuery } = useSearch()

const viewMode = ref<'grid' | 'list'>('grid')

const itemsToDisplay = computed(() => {
  const source = searchQuery.value.trim() ? searchResults.value : children.value
  return sortItems(source)
})

const isLoading = computed(() => {
  if (searchQuery.value.trim()) return isSearching.value
  return isChildrenLoading.value
})

const displayTitle = computed(() => {
  if (searchQuery.value.trim()) {
    return selectedFolderName.value
      ? `Search Results in "${selectedFolderName.value}"`
      : `Search Results in "This PC"`
  }
  return selectedFolderName.value || 'Home'
})

// Sentinel target for Infinite Scroll
const scrollSentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Create the observer once
observer = new IntersectionObserver(
  (entries) => {
    if (
      entries[0].isIntersecting &&
      hasMoreChildren.value &&
      !isChildrenLoadingMore.value
    ) {
      loadMoreChildren()
    }
  },
  { rootMargin: '200px', threshold: 0.1 }
)

// Re-attach whenever the sentinel mounts into/out of the DOM.
// The sentinel is inside a v-else block so it doesn't exist until items load.
watch(scrollSentinel, (el, prevEl) => {
  if (prevEl) observer!.unobserve(prevEl)
  if (el) observer!.observe(el)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
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
          :class="{
            'bg-bg-active text-text-primary shadow-sm': viewMode === 'grid',
          }"
          title="Grid View"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="h-4 w-4" />
        </BaseButton>
        <BaseButton
          variant="ghost"
          :class="{
            'bg-bg-active text-text-primary shadow-sm': viewMode === 'list',
          }"
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
      <EmptyState
        v-if="searchQuery && !isLoading && itemsToDisplay.length === 0"
        :icon="SearchX"
        theme="default"
        title="No results found"
        :description="`Try checking for typos or searching for a different keyword instead of &quot;${searchQuery}&quot;.`"
      />

      <!-- Error State -->
      <EmptyState
        v-else-if="contentError && !searchQuery"
        :icon="AlertTriangle"
        theme="danger"
        title="Path Not Found"
        :description="contentError"
      />

      <!-- No Selection State (Only show if not searching) -->
      <EmptyState
        v-else-if="
          !selectedFolderPath && !searchQuery && itemsToDisplay.length === 0
        "
        :icon="FolderOpen"
        theme="primary"
        title="Select a folder"
        description="Click on any directory from the left sidebar to view its contents."
      />

      <!-- Loading State -->
      <div v-else-if="isLoading">
        <!-- Search Loading State -->
        <EmptyState
          v-if="searchQuery.trim()"
          :icon="Search"
          theme="primary"
          :animate-icon="true"
          title="Searching..."
          :description="`Looking for &quot;${searchQuery}&quot; across your files...`"
        />

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
          <div class="mr-3 w-8 shrink-0"></div>
          <!-- icon space -->
          <div
            class="flex-1 pr-4"
            :class="searchQuery.trim() ? 'min-w-[150px]' : 'min-w-[200px]'"
          >
            Name
          </div>
          <div v-if="searchQuery.trim()" class="min-w-[150px] flex-1 pr-4">
            Location
          </div>
          <div class="w-[160px] shrink-0 pr-4">Date modified</div>
          <div class="w-[120px] shrink-0 pr-4">Type</div>
          <div class="w-[100px] shrink-0 text-right">Size</div>
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
            :show-location="!!searchQuery.trim()"
          />
        </div>

        <!-- Infinite Scroll Sentinel -->
        <div
          v-show="hasMoreChildren && !searchQuery.trim()"
          ref="scrollSentinel"
          class="text-text-secondary flex h-16 w-full items-center justify-center text-sm font-medium"
        >
          <span v-if="isChildrenLoadingMore" class="animate-pulse"
            >Loading next chunk...</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
