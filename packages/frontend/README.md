# @explorer/frontend

The frontend package for the **Windows Explorer-like File Manager** — a single-page application built with Vue 3, TypeScript, and Tailwind CSS v4. It provides a familiar dual-pane file explorer UI with a resizable sidebar tree, grid/list content views, live search, and a deep-space dark theme.

---

## Tech Stack

| Technology | Role |
|---|---|
| Vue 3 (Composition API) | UI framework |
| TypeScript | Type safety |
| Vue Router v4 | Application state routing |
| Vite 8 | Dev server & build tool |
| Tailwind CSS v4 | Utility-first styling |
| Lucide Vue Next | Icon library |
| `@explorer/shared` | Shared types (monorepo) |

---

## Project Structure

```
src/
├── components/
│   ├── base/                   # Reusable primitive components (atoms)
│   │   ├── BaseButton.vue      # Button with variant support (primary, ghost, icon)
│   │   ├── BaseInput.vue       # Styled input with v-model support
│   │   ├── EmptyState.vue      # Atomic container for warnings/loading/404s
│   │   └── FileIcon.vue        # Adaptive file/folder icon (grid & list sizes)
│   │
│   ├── layouts/
│   │   └── ExplorerLayout.vue  # Root shell: toolbar/sidebar/content/footer slots
│   │
│   └── views/                  # Feature-level smart components
│       ├── content/
│       │   ├── ContentPanel.vue   # Main file grid/list view with states
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
├── router/                     # URL state machine setup
│   └── index.ts                # Route definitions
│
├── composables/                # Singleton state hooks (no Pinia needed)
│   ├── useExplorer.ts          # State synced with Router + loading logic
│   ├── useFolderTree.ts        # Expand/collapse state for tree nodes
│   ├── useResizable.ts         # Drag-to-resize sidebar logic
│   └── useSearch.ts            # Debounced search w/ AbortController
│
├── services/
│   └── api.ts                  # Typed fetch wrapper with ApiClientError
│
├── utils/
│   ├── formatters.ts           # formatSize(), formatDate()
│   ├── sort.ts                 # Array isolation enforcing folders above files
│   └── fileIcons.ts            # getFileEmoji() lookup map
│
├── App.vue                     # Root: assembles layout with slot-based injection
├── main.ts                     # App entry point
└── style.css                   # Global CSS design tokens (dark theme)
```

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Backend running on `http://localhost:3000` (see `packages/backend`)

### Environment Setup

Copy the root `.env.example` and configure:

```bash
cp ../../.env.example ../../.env
```

Key frontend variable:

```env
# Default is /api — works out-of-the-box with the Vite dev proxy.
# For production, set to the full backend URL:
VITE_API_BASE_URL=/api
```

### Install & Run

```bash
# From the repo root
bun install

# Start the frontend dev server
bun dev
```

The app will be available at **http://localhost:5173**.

The Vite dev server proxies all `/api` requests to `http://localhost:3000` automatically (configured in `vite.config.ts`).

---

## Available Scripts

| Script | Description |
|---|---|
| `bun dev` | Start Vite dev server with HMR |
| `bun run build` | Type-check then build for production |
| `bun run preview` | Preview the production build locally |

---

## Architecture Decisions

### Base / Layout / View Pattern
Components are organized into three tiers:
- **`base/`** — Stateless, reusable primitives (`BaseButton`, `BaseInput`, `FileIcon`)
- **`layouts/`** — Structural shells that use named slots for composition, with zero data dependencies
- **`views/`** — Feature-aware components that read from composables and render business UI

### Singleton Composables (No Pinia)
State is declared at **module scope** inside each composable file. Every component that calls `useExplorer()` or `useSearch()` gets the exact same reactive refs — no global store required.

### URL-Driven State (Vue Router)
Instead of reinventing custom in-memory history arrays, the application URL acts as the single source of truth for the active folder state. `useExplorer.ts` utilizes a `router.afterEach` hook to synchronize navigation events with API data loading. This provides native Browser Back/Forward history integration and shareable deep-linking out-of-the-box, without needing a standard `<router-view>` layout!

### URL Query Search Binding
Searches performed via the `useSearch` module map seamlessly backward to the `?q=` parameter using `router.replace()`. Rehydrating searches through external linkage, or via simple Page Refreshes handles fetching naturally rather than dropping cached query state.

### Bounded Localized Searching
By leveraging the existing JSON folder graphs instantiated natively via the left-dashboard Explorer tree, database-search API requests append logical database parameter limits to prevent `This PC` global searches; guaranteeing users natively replicate standard Windows Explorer local-hierarchy constraints without suffering database `N+1` tree-rebuilding queries on search completion strings!

### Isolated Error Boundaries
The global `useExplorer` composable cleanly separates `treeError` (startup loading failures) from `contentError` (404 Path routing failures). This guarantees that a user landing on an invalid URL path in the main panel will see a scoped generic 404 message mapped to our Atomic `<EmptyState>`, without the error aggressively dismounting their entire left-sidebar tree navigation.

### Slot-Based Layout Injection
`App.vue` injects all major regions (`#toolbar`, `#sidebar`, `#content`, `#footer`) into `ExplorerLayout` as named slots. The layout itself only manages the resizable sidebar — it has no knowledge of any application data.
