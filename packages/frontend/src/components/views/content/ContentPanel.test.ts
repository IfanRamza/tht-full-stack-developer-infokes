import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import ContentPanel from './ContentPanel.vue'
import { ref } from 'vue'

/**
 * Component Test Suite: ContentPanel.vue
 *
 * These tests mount the real `ContentPanel` component inside a jsdom environment
 * to verify that its template conditionals (`v-if` / `v-else`) render the correct
 * child components based on the state values exposed by the composables.
 *
 * Mocking strategy:
 *
 * 1. IntersectionObserver — jsdom does not implement this browser API natively.
 *    A minimal stub class (`MockIntersectionObserver`) is assigned to `window`
 *    before any test runs. Without this, Vue's `<script setup>` in ContentPanel
 *    throws immediately when it instantiates `new IntersectionObserver(...)`.
 *
 * 2. useExplorer — replaced with a vi.fn() factory returning controlled reactive
 *    refs. This allows each test to dictate the exact loading/error/data state
 *    that ContentPanel receives, without needing a running API or router.
 *    `isChildrenLoading` is set to `true` by default to exercise the skeleton path.
 *
 * 3. useSearch — replaced with a stub returning an empty query and no results,
 *    ensuring the component renders in "directory view" mode (not search mode).
 *
 * 4. sortItems — replaced with an identity function so the sort utility doesn't
 *    interfere with the items array values passed in mocked state.
 *
 * `vi.clearAllMocks()` in `beforeEach` resets spy call counts between tests.
 */

// ─── IntersectionObserver stub ─────────────────────────────────────────────
// jsdom does not ship with IntersectionObserver. ContentPanel creates one in
// <script setup> scope, so this must be defined before any component is mounted.
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// ─── Composable mocks ──────────────────────────────────────────────────────
// useExplorer is the primary data source for ContentPanel. We control its
// reactive refs directly so tests don't depend on API, router, or DB state.
vi.mock('@/composables/useExplorer', () => ({
  useExplorer: vi.fn(() => ({
    children: ref([]),
    isChildrenLoading: ref(true), // force loading state to test skeleton rendering
    isChildrenLoadingMore: ref(false),
    hasMoreChildren: ref(false),
    loadMoreChildren: vi.fn(),
    selectedFolderPath: ref('/'),
    selectedFolderName: ref('Root'),
    contentError: ref(null),
  })),
}))

// useSearch stub: empty query ensures the component stays in directory (non-search) mode.
vi.mock('@/composables/useSearch', () => ({
  useSearch: vi.fn(() => ({
    searchResults: ref([]),
    isSearching: ref(false),
    searchQuery: ref(''),
  })),
}))

// sortItems stub: identity function so it doesn't transform the empty children array.
vi.mock('@/utils/sort', () => ({
  sortItems: vi.fn((items) => items),
}))

describe('ContentPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test 1 — Skeleton rendered during loading state
   *
   * Purpose:
   *   Verifies that `ContentPanel` renders `<GridSkeleton>` placeholder components
   *   when `isChildrenLoading` is `true`, and does NOT render any `<ContentItem>`
   *   components at the same time.
   *
   *   This confirms that the `v-if="isLoading"` / `v-else` conditional in the
   *   template correctly switches between the skeleton loading state and the
   *   real item list — preventing a partial or empty grid from flashing before
   *   data arrives.
   *
   * Setup:
   *   - `useExplorer` mock returns `isChildrenLoading: ref(true)` and `children: ref([])`.
   *   - `useSearch` mock returns `searchQuery: ref('')`, keeping the component in
   *     directory mode where `isLoading` derives from `isChildrenLoading`.
   *
   * Expected result:
   *   - At least one `<GridSkeleton>` component is present in the rendered output.
   *   - Zero `<ContentItem>` components are present — real items must not render
   *     while a load is in progress.
   */
  it('renders Loading Skeleton arrays when Composables broadcast Loading states natively', () => {
    const wrapper = mount(ContentPanel)

    // Skeleton placeholders must be visible during loading
    const skeletons = wrapper.findAllComponents({ name: 'GridSkeleton' })
    expect(skeletons.length).toBeGreaterThan(0)

    // Real item cards must not render while loading is in progress
    const items = wrapper.findAllComponents({ name: 'ContentItem' })
    expect(items.length).toBe(0)
  })
})
