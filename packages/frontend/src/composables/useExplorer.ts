import { router } from '@/router'
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

// History tracking
const canGoBack = ref(false)
const canGoForward = ref(false)

// Bind router to module state
router.afterEach((to) => {
  // Update disabled states for Toolbar
  canGoBack.value = window.history.state?.back != null
  canGoForward.value = window.history.state?.forward != null

  if (to.name === 'folder' && to.params.id) {
    _fetchChildren(to.params.id as string)
  } else {
    // Navigated to Home / root
    selectedFolderId.value = null
    selectedFolderName.value = null
    children.value = []
  }
})

/**
 * Internal private loader synchronized with URL state
 */
async function _fetchChildren(id: string) {
  selectedFolderId.value = id
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

export function useExplorer() {
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

  function selectFolder(id: string | null) {
    if (id) {
      router.push({ name: 'folder', params: { id } })
    } else {
      router.push('/')
    }
  }

  function goBack() {
    router.back()
  }

  function goForward() {
    router.forward()
  }

  function goUp() {
    if (!selectedFolderId.value) return

    // Find parent in the tree recursively
    const findParent = (
      nodes: TreeNode[],
      targetId: string
    ): string | null | undefined => {
      for (const node of nodes) {
        if (node.id === targetId) return node.parentId
        if (node.children) {
          const found = findParent(node.children, targetId)
          if (found !== undefined) return found
        }
      }
      return undefined
    }

    const parentId = findParent(tree.value, selectedFolderId.value)

    if (parentId) {
      router.push({ name: 'folder', params: { id: parentId } })
    } else {
      router.push('/')
    }
  }

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
    canGoBack,
    canGoForward,
    loadTree,
    selectFolder,
    goBack,
    goForward,
    goUp,
  }
}
