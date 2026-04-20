<template>
  <div class="flex animate-pulse flex-col">
    <div
      v-for="i in 10"
      :key="i"
      class="border-border/50 flex items-center gap-4 border-b px-4 py-3"
    >
      <div class="bg-bg-hover h-5 w-5 shrink-0 rounded"></div>
      <div class="bg-bg-hover h-3 w-32 rounded"></div>
    </div>
  </div>
</template>
