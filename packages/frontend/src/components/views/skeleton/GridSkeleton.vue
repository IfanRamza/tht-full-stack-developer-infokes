<template>
  <div
    class="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  >
    <div
      v-for="i in 10"
      :key="i"
      class="bg-bg-secondary border-border flex flex-col items-center rounded border p-4"
    >
      <div class="bg-bg-hover mb-3 h-12 w-12 rounded"></div>
      <div class="bg-bg-hover mb-1.5 h-3 w-16 rounded"></div>
      <div class="bg-bg-hover h-2 w-10 rounded"></div>
    </div>
  </div>
</template>
