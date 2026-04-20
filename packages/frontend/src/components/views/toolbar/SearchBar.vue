<script setup lang="ts">
import BaseInput from '@/components/base/BaseInput.vue'
import { useSearch } from '@/composables/useSearch'
import { Search, X } from 'lucide-vue-next'

const { searchQuery, isSearching, clearSearch } = useSearch()
</script>

<template>
  <div class="group relative w-full">
    <!-- Icon -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
    >
      <Search
        class="group-focus-within:text-accent-blue h-4 w-4 transition-colors"
        :class="
          isSearching ? 'text-accent-blue animate-pulse' : 'text-text-muted'
        "
      />
    </div>

    <!-- Input -->
    <BaseInput
      v-model="searchQuery"
      placeholder="Search..."
      class="pr-8 pl-9 text-[13px]"
    />

    <!-- Clear Button -->
    <button
      v-if="searchQuery"
      @click="clearSearch"
      class="text-text-muted hover:text-text-primary absolute inset-y-0 right-0 flex items-center pr-2 transition-colors"
    >
      <X class="h-[14px] w-[14px]" />
    </button>
  </div>
</template>
