import { router } from '@/router'
import { itemApi } from '@/services/api'
import type { Item, TreeNode } from '@explorer/shared'
import { onMounted, ref } from 'vue'

const tree = ref<TreeNode[]>([])
const selectedFolderPath = ref<string>('')
const selectedFolderName = ref<string | null>(null)
const children = ref<Item[]>([])

const isTreeLoading = ref(false)
const isChildrenLoading = ref(false)
const treeError = ref<string | null>(null)
const contentError = ref<string | null>(null)

// History tracking
const canGoBack = ref(false)
const canGoForward = ref(false)

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

  _fetchChildren(pathString)
})

/**
 * Internal private loader synchronized with URL state
 */
async function _fetchChildren(path: string) {
  selectedFolderPath.value = path
  isChildrenLoading.value = true
  contentError.value = null
  try {
    const { folder, children: items } = await itemApi.getChildrenByPath(path)
    selectedFolderName.value = folder.name
    children.value = items
  } catch (e: unknown) {
    contentError.value =
      e instanceof Error ? e.message : 'Failed to load folder contents'
  } finally {
    isChildrenLoading.value = false
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
    treeError,
    contentError,
    canGoBack,
    canGoForward,
    loadTree,
    selectFolder,
    goBack,
    goForward,
    goUp,
  }
}
