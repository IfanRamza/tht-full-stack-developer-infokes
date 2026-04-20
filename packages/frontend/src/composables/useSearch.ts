import { itemApi } from '@/services/api'
import type { Item } from '@explorer/shared'
import { ref, watch } from 'vue'

const searchQuery = ref('')
const searchResults = ref<Item[]>([])
const isSearching = ref(false)
const error = ref<string | null>(null)

let timeout: ReturnType<typeof setTimeout> | null = null
let abortController: AbortController | null = null

const DEBOUNCE_MS = 600

async function performSearch(query: string) {
  if (!query) {
    searchResults.value = []
    return
  }

  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()

  isSearching.value = true
  error.value = null
  try {
    searchResults.value = await itemApi.search(query, abortController.signal)
  } catch (e: unknown) {
    // Check AbortError
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Search failed'
    searchResults.value = []
  } finally {
    isSearching.value = false
    abortController = null
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  isSearching.value = false
  error.value = null
  if (timeout) clearTimeout(timeout)
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

watch(searchQuery, (newQuery) => {
  if (timeout) clearTimeout(timeout)

  if (!newQuery.trim()) {
    searchResults.value = []
    isSearching.value = false
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    return
  }

  timeout = setTimeout(() => {
    performSearch(newQuery.trim())
  }, DEBOUNCE_MS)
})

export function useSearch() {
  return {
    searchQuery,
    searchResults,
    isSearching,
    error,
    clearSearch,
  }
}
