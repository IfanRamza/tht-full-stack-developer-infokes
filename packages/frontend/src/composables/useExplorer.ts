import { router } from '@/router'
import { itemApi } from '@/services/api'
import type { Item, TreeNode } from '@explorer/shared'
import { computed, onMounted, ref } from 'vue'

const tree = ref<TreeNode[]>([])
const selectedFolderPath = ref<string>('')
const selectedFolderName = ref<string | null>(null)
const children = ref<Item[]>([])
const totalChildren = ref(0)
const currentOffset = ref(0)

const isTreeLoading = ref(false)
const isChildrenLoading = ref(false)
const isChildrenLoadingMore = ref(false)
const treeError = ref<string | null>(null)
const contentError = ref<string | null>(null)

// Computational math for pagination scaling
const hasMoreChildren = computed(
  () => children.value.length < totalChildren.value
)

// History tracking
const canGoBack = ref(false)
const canGoForward = ref(false)

// In-Memory UUID -> Folder Name map for translating backend paths
const idToNameMap = computed(() => {
  const map: Record<string, string> = {}
  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      map[node.id] = node.name
      if (node.children) traverse(node.children)
    }
  }
  traverse(tree.value)
  return map
})

// Bind router to module state
router.afterEach((to) => {
  canGoBack.value = window.history.state?.back != null
  canGoForward.value = window.history.state?.forward != null

  let pathString = ''
  if (to.params.pathMatch) {
    if (Array.isArray(to.params.pathMatch)) {
      pathString = to.params.pathMatch.join('/')
    } else {
      pathString = to.params.pathMatch
    }
  }

  // If hitting the root, clear the right pane instantly.
  if (!pathString) {
    selectedFolderPath.value = ''
    selectedFolderName.value = null
    children.value = []
    totalChildren.value = 0
    currentOffset.value = 0
    contentError.value = null
    return
  }

  _fetchChildren(pathString)
})

/**
 * Internal private loader synchronized with URL state
 */
async function _fetchChildren(path: string, isLoadMore = false) {
  if (!isLoadMore) {
    selectedFolderPath.value = path
    children.value = []
    currentOffset.value = 0
    isChildrenLoading.value = true
  } else {
    isChildrenLoadingMore.value = true
  }

  contentError.value = null

  try {
    const limit = 50
    const {
      folder,
      children: items,
      totalElements,
    } = await itemApi.getChildrenByPath(path, limit, currentOffset.value)

    selectedFolderName.value = folder.name
    totalChildren.value = totalElements

    if (isLoadMore) {
      children.value.push(...items)
    } else {
      children.value = items
    }

    currentOffset.value += items.length
  } catch (e: unknown) {
    contentError.value =
      e instanceof Error ? e.message : 'Failed to load folder contents'
  } finally {
    isChildrenLoading.value = false
    isChildrenLoadingMore.value = false
  }
}

export function useExplorer() {
  async function loadTree() {
    isTreeLoading.value = true
    treeError.value = null
    try {
      tree.value = await itemApi.getTree()
    } catch (e: unknown) {
      treeError.value =
        e instanceof Error ? e.message : 'Failed to load folder tree'
    } finally {
      isTreeLoading.value = false
    }
  }

  function selectFolder(path: string) {
    // If selecting root, reset path
    if (path === '/') path = ''
    router.push({ path: `/${path}` })
  }

  function goBack() {
    router.back()
  }

  function goForward() {
    router.forward()
  }

  function goUp() {
    if (!selectedFolderPath.value) return // Already at root

    // Mathematically slice off the last segment of the URL path
    const segments = selectedFolderPath.value.split('/').filter(Boolean)
    segments.pop() // remove current directory
    const parentPath = segments.join('/')

    router.push({ path: `/${parentPath}` })
  }

  function loadMoreChildren() {
    if (hasMoreChildren.value && !isChildrenLoadingMore.value) {
      _fetchChildren(selectedFolderPath.value, true)
    }
  }

  /**
   * Resolves a backend DB UUID path like `/uuid1/uuid2` into `/Documents/Work`
   * by matching against the loaded frontend tree map.
   */
  function getHumanReadableLocation(uuidPath: string) {
    if (!uuidPath) return '/'

    const ids = uuidPath.split('/').filter(Boolean)
    // The DB path includes the item's own ID at the end.
    // We only want the *location* (the parent's path).
    ids.pop()

    if (ids.length === 0) return '/'
    return '/' + ids.map((id) => idToNameMap.value[id] || id).join('/')
  }

  onMounted(() => {
    if (tree.value.length === 0 && !isTreeLoading.value) {
      loadTree()
    }
  })

  return {
    tree,
    selectedFolderPath,
    selectedFolderName,
    children,
    isTreeLoading,
    isChildrenLoading,
    isChildrenLoadingMore,
    hasMoreChildren,
    treeError,
    contentError,
    canGoBack,
    canGoForward,
    loadTree,
    selectFolder,
    goBack,
    goForward,
    goUp,
    loadMoreChildren,
    getHumanReadableLocation,
  }
}
