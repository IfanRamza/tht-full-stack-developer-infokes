<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { useExplorer } from '@/composables/useExplorer'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HardDrive,
} from 'lucide-vue-next'
import Breadcrumb from './Breadcrumb.vue'
import SearchBar from './SearchBar.vue'

const { selectedFolderPath, canGoBack, canGoForward, goBack, goForward, goUp } =
  useExplorer()
</script>

<template>
  <header
    class="border-border bg-bg-secondary z-10 flex h-14 shrink-0 items-center border-b px-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
  >
    <!-- navigation Controls -->
    <div class="mr-4 flex items-center gap-1">
      <BaseButton variant="icon" :disabled="!canGoBack" @click="goBack">
        <ChevronLeft class="h-5 w-5" />
      </BaseButton>
      <BaseButton variant="icon" :disabled="!canGoForward" @click="goForward">
        <ChevronRight class="h-5 w-5" />
      </BaseButton>
      <BaseButton variant="icon" :disabled="!selectedFolderPath" @click="goUp">
        <ChevronUp class="h-5 w-5" />
      </BaseButton>
    </div>

    <!-- Breadcrumbs Path -->
    <div
      class="border-border bg-bg-tertiary hover:border-text-muted mr-4 flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 transition-colors"
    >
      <HardDrive class="text-accent-cyan h-4 w-4" />
      <Breadcrumb />
    </div>

    <!-- Search Box -->
    <div class="w-64">
      <SearchBar />
    </div>
  </header>
</template>
