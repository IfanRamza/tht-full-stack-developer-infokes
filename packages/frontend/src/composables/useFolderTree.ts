import { ref } from 'vue'

const expandedIds = ref<Set<string>>(new Set())
export function useFolderTree() {
  function isExpanded(id: string): boolean {
    return expandedIds.value.has(id)
  }

  function toggle(id: string) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
  }

  // Expand folder
  function expand(id: string) {
    expandedIds.value.add(id)
  }

  // Collapse Folder
  function collapse(id: string) {
    expandedIds.value.delete(id)
  }

  // Collapse All
  function collapseAll() {
    expandedIds.value.clear()
  }

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    collapseAll,
  }
}
