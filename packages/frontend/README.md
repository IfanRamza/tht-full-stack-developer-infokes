# @explorer/frontend

The frontend package for the **Windows Explorer-like File Manager** — a single-page application built with Vue 3, TypeScript, and Tailwind CSS v4. It provides a familiar dual-pane file explorer UI with a resizable sidebar tree, grid/list content views, infinite scroll pagination, live search, and a deep-space dark theme.

---

## Tech Stack

| Technology | Role |
|---|---|
| Vue 3 (Composition API) | UI framework |
| TypeScript | Type safety |
| Vue Router v5 | URL-driven navigation & history |
| Vite 8 | Dev server & build tool |
| Tailwind CSS v4 | Utility-first styling |
| Lucide Vue Next | Icon library |
| Vitest + Vue Test Utils | Unit & component testing |
| jsdom | Headless DOM environment for tests |
| `@explorer/shared` | Shared types (monorepo) |

---

## Project Structure

```
src/
├── components/
│   ├── base/                      # Reusable primitive components (atoms)
│   │   ├── BaseButton.vue         # Button with variant support (primary, ghost, icon)
│   │   ├── BaseInput.vue          # Styled input with v-model support
│   │   ├── EmptyState.vue         # Container for empty/error/404 states
│   │   └── FileIcon.vue           # Adaptive file/folder icon (grid & list sizes)
│   │
│   ├── layouts/
│   │   └── ExplorerLayout.vue     # Root shell: toolbar/sidebar/content/footer slots
│   │
│   └── views/                     # Feature-level smart components
│       ├── content/
│       │   ├── ContentPanel.vue   # Main file grid/list view with infinite scroll
│       │   ├── ContentPanel.test.ts  # Component unit tests
│       │   └── ContentItem.vue    # Single file/folder row/card
│       ├── error-boundary/
│       │   └── ErrorBoundary.vue  # Catches runtime errors, shows fallback UI
│       ├── footer/
│       │   └── StatusBar.vue      # Item count & size — search-aware
│       ├── sidebar/
│       │   ├── FolderTree.vue     # Left-pane recursive tree root
│       │   └── FolderTreeNode.vue # Recursive tree node with expand/collapse
│       ├── skeleton/
│       │   ├── GridSkeleton.vue   # Loading placeholder (grid view)
│       │   └── ListSkeleton.vue   # Loading placeholder (list view)
│       └── toolbar/
│           ├── Toolbar.vue        # Top bar wrapper
│           ├── Breadcrumb.vue     # Path-based breadcrumb generator
│           └── SearchBar.vue      # Debounced search input with clear button
│
├── composables/                   # Singleton state hooks (no Pinia needed)
│   ├── useExplorer.ts             # Core navigation state synced with Router
│   ├── useExplorer.test.ts        # Composable unit tests
│   ├── useFolderTree.ts           # Expand/collapse state for tree nodes
│   ├── useResizable.ts            # Drag-to-resize sidebar logic
│   └── useSearch.ts               # Debounced search w/ AbortController
│
├── router/
│   └── index.ts                   # Catch-all wildcard route definitions
│
├── services/
│   └── api.ts                     # Typed fetch client (itemApi)
│
├── utils/
│   ├── formatters.ts              # formatSize(), formatDate()
│   ├── sort.ts                    # sortItems() — folders always above files
│   └── fileIcons.ts               # getFileEmoji() lookup map
│
├── App.vue                        # Root: slot-based layout composition
├── main.ts                        # App entry point
└── style.css                      # Global CSS design tokens (dark theme)
```

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) `>= 1.0`
- Backend API running on `http://localhost:3000` (see `packages/backend`)

### Environment Setup

The key frontend variable in `.env`:

```env
# Default — works with Vite's dev proxy out of the box.
# In production, set to the full backend URL.
VITE_API_BASE_URL=/api
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000` automatically.

### Install & Run

```bash
# From the repo root
bun install

# Start the dev server (from this package directory)
bun dev
```

Available at **http://localhost:5173**.

---

## Available Scripts

| Script | Description |
|---|---|
| `bun dev` | Start Vite dev server with HMR |
| `bun run build` | Type-check then build for production |
| `bun run preview` | Preview the production build locally |
| `bun run test` | Run all unit & component tests with Vitest |

---

## Testing

```bash
bun run test
```

Tests are co-located next to the files they cover (`.test.ts` suffix). The test environment uses **jsdom** for headless DOM simulation.

### Composable Tests — `useExplorer.test.ts`

Uses a `withSetup()` helper that mounts a minimal headless Vue component to provide the lifecycle context `useExplorer` requires. Both `@/services/api` and `@/router` are fully mocked.

| Test | What it verifies |
|---|---|
| `selectFolder('/')` | Routes to `{ path: '/' }` |
| `selectFolder('Documents/Work')` | Routes to `{ path: '/Documents/Work' }` |
| `goUp()` from nested path | Pops last segment and routes to parent |
| `goUp()` at root | No router call made |
| `loadTree()` loading state | `isTreeLoading` is `true` during fetch, `false` after |
| `loadMoreChildren()` guard | Does not call API when `hasMoreChildren` is false |

### Component Tests — `ContentPanel.test.ts`

Mounts `ContentPanel` with mocked composables and a stub `IntersectionObserver` class (not available in jsdom).

| Test | What it verifies |
|---|---|
| Skeleton on loading state | `<GridSkeleton>` renders when `isChildrenLoading` is `true`, `<ContentItem>` does not |

---

## Architecture Decisions

### Base / Layout / View Pattern

Components are organized into three tiers:
- **`base/`** — Stateless, reusable primitives with no data dependencies
- **`layouts/`** — Structural shells using named slots for composition
- **`views/`** — Feature-aware components that read from composables

### Singleton Composables (No Pinia)

State is declared at **module scope** inside each composable. Every component calling `useExplorer()` or `useSearch()` shares the exact same reactive refs — no global store configuration required.

### URL-Driven Navigation

The active folder path *is* the URL. `useExplorer.ts` hooks into `router.afterEach` to trigger API fetches whenever the route changes. This provides:
- Native browser Back/Forward history for free
- Shareable deep-linked folder URLs
- No `<router-view>` required — the URL is purely state, not a rendering target

### Infinite Scroll with `watch(scrollSentinel)`

The `ContentPanel` fetches the first 50 items on load. A sentinel `<div>` at the bottom of the list is observed by `IntersectionObserver`. When visible, it triggers `loadMoreChildren()` to fetch the next page (`offset += 50`).

Rather than using `onMounted` + `setTimeout`, the observer is attached via `watch(scrollSentinel)`. This is critical because the sentinel lives inside a `v-else` block — it is not in the DOM until items load. The `watch` fires exactly when the element enters the DOM:

```typescript
// Attaches/detaches observer reactively as sentinel mounts/unmounts
watch(scrollSentinel, (el, prevEl) => {
  if (prevEl) observer!.unobserve(prevEl)
  if (el) observer!.observe(el)
})
```

### Folder-First Ordering

The backend enforces folder-before-file ordering at the SQL level. The frontend additionally runs `sortItems()` on all API responses to guarantee consistent ordering regardless of how items are fetched (search vs. directory listing).

### Scoped Error Handling

`useExplorer` maintains two separate error refs:
- `treeError` — sidebar tree load failures (shown inline in the sidebar)
- `contentError` — content panel failures, e.g. invalid path (shown in the main panel only)

This prevents a 404 on an invalid URL from crashing the entire sidebar navigation.

### Slot-Based Layout Injection

`App.vue` injects all major regions (`#toolbar`, `#sidebar`, `#content`, `#footer`) into `ExplorerLayout` as named slots. The layout only manages the resizable sidebar width — it has zero knowledge of application data.
