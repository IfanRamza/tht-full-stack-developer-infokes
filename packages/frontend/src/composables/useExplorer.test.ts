import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useExplorer } from './useExplorer'
import { itemApi } from '@/services/api'
import { router } from '@/router'

/**
 * Unit Test Suite: useExplorer Composable
 *
 * These tests cover the core navigation and state logic inside `useExplorer.ts`
 * in complete isolation — no real API calls are made and no real Vue Router
 * instance is started.
 *
 * Mocking strategy:
 * - `@/services/api` is fully replaced with vi.fn() spies so outbound HTTP
 *   requests never fire. Default return values are provided so `onMounted`
 *   hooks (which call `loadTree`) don't throw on resolution.
 * - `@/router` is replaced with a plain object of vi.fn() spies so navigation
 *   side-effects (push, back, forward) can be asserted without a real router.
 * - `vi.clearAllMocks()` in `beforeEach` resets all spy call counts and
 *   resolved values between tests to prevent state leakage.
 *
 * withSetup() wrapper:
 *   `useExplorer` calls `onMounted`, which Vue requires to run inside an active
 *   component instance. `withSetup()` mounts a minimal headless component
 *   (no template) solely to provide this lifecycle context, then returns the
 *   composable result for direct assertion.
 */

/**
 * Mounts a minimal headless Vue component to provide lifecycle context,
 * executes the given composable hook inside `setup()`, and returns its result.
 *
 * This is the standard pattern for testing composables that use lifecycle
 * hooks (onMounted, watch, etc.) outside of a real component tree.
 */
function withSetup(hook: () => any) {
  let result: any
  mount(defineComponent({
    setup() {
      result = hook()
      return () => {}
    }
  }))
  return result
}

// All API calls are intercepted — no real HTTP requests leave the process.
// Default resolved values prevent onMounted's `loadTree()` call from failing.
vi.mock('@/services/api', () => ({
  itemApi: {
    getTree: vi.fn().mockResolvedValue([]),
    getChildrenByPath: vi.fn().mockResolvedValue({ folder: {}, children: [], totalElements: 0 }),
  },
}))

// Router methods are replaced with spies so navigation calls can be asserted
// without needing a real VueRouter instance or actual URL changes.
vi.mock('@/router', () => ({
  router: {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    afterEach: vi.fn(), // prevents the router.afterEach registration from throwing
  },
}))

describe('useExplorer Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks() // reset all spy call history between tests
  })

  // ─── Navigation ────────────────────────────────────────────────────────────

  /**
   * Test 1 — selectFolder() routing
   *
   * Purpose:
   *   Verifies that `selectFolder()` correctly translates a folder path string
   *   into a `router.push()` call with the expected `{ path }` argument.
   *   The root special-case (`'/'`) must also be normalised correctly.
   *
   * Expected result:
   *   - `selectFolder('/')` calls `router.push({ path: '/' })`.
   *   - `selectFolder('Documents/Work')` calls `router.push({ path: '/Documents/Work' })`.
   *   The composable must prepend a leading slash to the provided path string.
   */
  it('should correctly select a folder and invoke router.push', () => {
    const { selectFolder } = withSetup(() => useExplorer())

    // Root path: the special case '/' must not result in '//'
    selectFolder('/')
    expect(router.push).toHaveBeenCalledWith({ path: '/' })

    // Nested path: leading slash is prepended automatically
    selectFolder('Documents/Work')
    expect(router.push).toHaveBeenCalledWith({ path: '/Documents/Work' })
  })

  /**
   * Test 2 — goUp() from a nested path
   *
   * Purpose:
   *   Verifies that `goUp()` correctly removes the last segment from the
   *   current `selectedFolderPath` and navigates to the parent directory.
   *
   * Setup:
   *   `selectedFolderPath` is manually set to `'Documents/Work/Engineering'`
   *   to simulate a deeply navigated state without needing a real router event.
   *
   * Expected result:
   *   - `router.push` is called with `{ path: '/Documents/Work' }`.
   *   - The segment `'Engineering'` is removed; the two parent segments remain.
   */
  it('should cleanly parse and resolve goUp directory actions', () => {
    const { goUp, selectedFolderPath } = withSetup(() => useExplorer())

    // Simulate being inside Documents/Work/Engineering
    selectedFolderPath.value = 'Documents/Work/Engineering'

    goUp()

    // "Engineering" is popped; navigates one level up
    expect(router.push).toHaveBeenCalledWith({ path: '/Documents/Work' })
  })

  /**
   * Test 3 — goUp() guard at root
   *
   * Purpose:
   *   Verifies that `goUp()` is a no-op when the user is already at the root
   *   (empty `selectedFolderPath`). There is no parent to navigate to, so no
   *   navigation should be triggered.
   *
   * Setup:
   *   `selectedFolderPath` is set to `''` (the root state).
   *
   * Expected result:
   *   - `router.push` is never called.
   *   - The composable silently returns without throwing.
   */
  it('should bypass goUp executions cleanly if currently parked at root boundary', () => {
    const { goUp, selectedFolderPath } = withSetup(() => useExplorer())

    // Already at root — goUp should be a safe no-op
    selectedFolderPath.value = ''
    goUp()

    expect(router.push).not.toHaveBeenCalled()
  })

  // ─── Loading State ─────────────────────────────────────────────────────────

  /**
   * Test 4 — loadTree() loading state transitions
   *
   * Purpose:
   *   Verifies that `loadTree()` correctly manages the `isTreeLoading` flag
   *   during an async API call — `true` while pending, `false` on completion —
   *   and that `tree` is populated with the resolved data afterwards.
   *
   * Mock setup:
   *   `itemApi.getTree` is overridden for this test to return a single mock
   *   folder node, simulating a real API response.
   *
   * Expected result:
   *   - Immediately after calling `loadTree()` (before awaiting), `isTreeLoading`
   *     is `true`, ensuring skeleton loaders display during the fetch.
   *   - After awaiting, `isTreeLoading` is `false` and `tree.value` contains
   *     the mock data returned by the spy.
   */
  it('loadTree properly maps true/false loading intervals globally', async () => {
    const { loadTree, isTreeLoading, tree } = withSetup(() => useExplorer())

    const mockData = [{ id: '1', name: 'Documents', children: [] }]
    vi.mocked(itemApi.getTree).mockResolvedValueOnce(mockData as any)

    const promise = loadTree()

    // Synchronously check: loading must be true before the promise resolves
    expect(isTreeLoading.value).toBe(true)

    await promise

    // After resolution: loading is cleared and tree is populated
    expect(isTreeLoading.value).toBe(false)
    expect(tree.value).toEqual(mockData)
  })

  /**
   * Test 5 — loadMoreChildren() guard when no more pages exist
   *
   * Purpose:
   *   Verifies that `loadMoreChildren()` does not trigger an API call when
   *   `hasMoreChildren` is `false`. This is the infinite scroll safety guard —
   *   if the client has already loaded all items, no further pagination
   *   requests should be fired.
   *
   * Setup:
   *   `children` is explicitly reset to `[]` and no initial load is performed,
   *   so `totalChildren` remains 0. Since `children.length (0) < totalChildren (0)`
   *   evaluates to `false`, `hasMoreChildren` is `false` by default.
   *
   * Expected result:
   *   - `itemApi.getChildrenByPath` is never called.
   *   - The composable exits `loadMoreChildren()` silently without fetching.
   */
  it('loadMoreChildren automatically cascades safely catching offset limit bounds', async () => {
    const { loadMoreChildren, selectedFolderPath, children } = withSetup(() => useExplorer())

    // Simulate a folder is selected but no initial load has occurred yet
    selectedFolderPath.value = 'Downloads'
    children.value = []

    // hasMoreChildren = (0 < 0) = false → no fetch should occur
    loadMoreChildren()
    expect(itemApi.getChildrenByPath).not.toHaveBeenCalled()
  })
})
