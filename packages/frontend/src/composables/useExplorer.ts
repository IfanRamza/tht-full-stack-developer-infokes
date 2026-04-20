import { itemApi } from '@/services/api'
import type { Item, TreeNode } from '@explorer/shared'
import { onMounted, ref } from 'vue'

const tree = ref<TreeNode[]>([])
const selectedFolderId = ref<string | null>(null)
const selectedFolderName = ref<string | null>(null)
const children = ref<Item[]>([])

const isTreeLoading = ref(false)
const isChildrenLoading = ref(false)
const error = ref<string | null>(null)

export function useExplorer() {
  /**
   * Fetches the entire folder tree from the backend (one round-trip on mount).
   */
  async function loadTree() {
    isTreeLoading.value = true
    error.value = null
    try {
      tree.value = await itemApi.getTree()
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : 'Failed to load folder tree'
    } finally {
      isTreeLoading.value = false
    }
  }

  /**
   * Selects a folder and loads its direct children for the right panel.
   * Destructures FolderContent so both folder metadata and children are stored.
   */
  async function selectFolder(id: string, name?: string) {
    selectedFolderId.value = id
    selectedFolderName.value = name ?? null
    isChildrenLoading.value = true
    error.value = null
    try {
      const { folder, children: items } = await itemApi.getChildren(id)
      selectedFolderName.value = folder.name
      children.value = items
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : 'Failed to load folder contents'
    } finally {
      isChildrenLoading.value = false
    }
  }

  /**
   * Resets the current folder selection and clears the right panel.
   */
  function clearSelection() {
    selectedFolderId.value = null
    selectedFolderName.value = null
    children.value = []
  }

  // Auto-load the tree when any component using this composable first mounts
  onMounted(() => {
    if (tree.value.length === 0 && !isTreeLoading.value) {
      loadTree()
    }
  })

  return {
    tree,
    selectedFolderId,
    selectedFolderName,
    children,
    isTreeLoading,
    isChildrenLoading,
    error,
    loadTree,
    selectFolder,
    clearSelection,
  }
}
