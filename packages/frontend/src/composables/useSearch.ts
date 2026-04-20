import { itemApi } from '@/services/api'
import type { Item } from '@explorer/shared'
import { ref, watch } from 'vue'
import { router } from '@/router'
import { useExplorer } from './useExplorer'

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
  
  const { selectedFolderPath } = useExplorer()
  
  try {
    searchResults.value = await itemApi.search(
      query, 
      selectedFolderPath.value, 
      abortController.signal
    )
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
  
  // Clear URL query visually
  const currentQ = router.currentRoute.value.query.q
  if (currentQ) {
    const currentRoute = router.currentRoute.value
    router.replace({ path: currentRoute.path, query: {} })
  }
}

// Intercept routing events (like page loads, back/forward buttons) 
// to automatically rehydrate the search query from the ?q= url params
router.afterEach((to) => {
  const q = to.query.q as string | undefined
  if (q !== undefined && q !== searchQuery.value) {
    searchQuery.value = q
  } else if (!q && searchQuery.value) {
    searchQuery.value = ''
  }
})

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
    const trimmed = newQuery.trim()
    
    // Seamlessly sync URL parameter backwards without blowing up browser history stack
    const currentQ = router.currentRoute.value.query.q
    if (currentQ !== trimmed && trimmed.length > 0) {
      router.replace({ query: { q: trimmed } })
    }

    performSearch(trimmed)
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
