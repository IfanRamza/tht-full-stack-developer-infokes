# @explorer/frontend

The frontend package for the **Windows Explorer-like File Manager** — a single-page application built with Vue 3, TypeScript, and Tailwind CSS v4. It provides a familiar dual-pane file explorer UI with a resizable sidebar tree, grid/list content views, live search, and a deep-space dark theme.

---

## Tech Stack

| Technology | Role |
|---|---|
| Vue 3 (Composition API) | UI framework |
| TypeScript | Type safety |
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
│           └── SearchBar.vue      # Debounced search input with clear button
│
├── composables/                # Singleton state hooks (no Pinia needed)
│   ├── useExplorer.ts          # Folder tree + children fetch + selection state
│   ├── useFolderTree.ts        # Expand/collapse state for tree nodes
│   ├── useResizable.ts         # Drag-to-resize sidebar logic
│   └── useSearch.ts            # Debounced search w/ AbortController
│
├── services/
│   └── api.ts                  # Typed fetch wrapper with ApiClientError
│
├── utils/
│   ├── formatters.ts           # formatSize(), formatDate()
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

### AbortController in Search
`useSearch` cancels the previous in-flight HTTP request before issuing a new one, preventing stale responses from overwriting newer results on fast typing.

### Slot-Based Layout Injection
`App.vue` injects all major regions (`#toolbar`, `#sidebar`, `#content`, `#footer`) into `ExplorerLayout` as named slots. The layout itself only manages the resizable sidebar — it has no knowledge of any application data.
